import { performance } from "perf_hooks";
import * as https from "https";
import * as http from "http";
import * as dns from "dns";
import * as net from "net";
export const defaultEndpoints = [
    "https://dweb.link",
    "https://ipfs.io",
    "https://cloudflare-ipfs.com",
    "https://cf-ipfs.com",
    "https://gateway.pinata.cloud",
    "https://4everland.io",
    "https://ipfs.fleek.co",
    "https://crustwebsites.net",
    "https://hardbin.com",
    "https://jorropo.net",
    "https://ipfs.runfission.com",
    "https://ipfs.eternum.io",
];
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getEndpointType(endpoint) {
    // Heuristic: if contains 'provider' or 'sp', mark as storage provider
    if (/provider|sp/i.test(endpoint))
        return "Storage Provider";
    return "Gateway";
}
async function fetchWithAdvancedMetrics(endpoint, cid, timeout) {
    return new Promise((resolve) => {
        const timings = {};
        const url = `${endpoint.replace(/\/$/, "")}/ipfs/${cid}`;
        const endpointType = getEndpointType(endpoint);
        // DNS lookup
        const { hostname } = new URL(url);
        const dnsStart = performance.now();
        dns.lookup(hostname, (err, address) => {
            const dnsEnd = performance.now();
            timings.dnsTime = dnsEnd - dnsStart;
            if (err) {
                resolve({
                    error: "DNS Lookup Failed",
                    dnsTime: timings.dnsTime,
                    endpointType,
                });
                return;
            }
            // TCP connect
            const port = url.startsWith("https") ? 443 : 80;
            const tcpStart = performance.now();
            const socket = net.connect(port, address, () => {
                const tcpEnd = performance.now();
                timings.tcpTime = tcpEnd - tcpStart;
                socket.destroy();
                // HTTP(S) request
                let req;
                const lib = url.startsWith("https") ? https : http;
                const options = new URL(url);
                const start = performance.now();
                timings.start = start;
                req = lib.get({ ...options, timeout }, (res) => {
                    timings.response = performance.now();
                    let bytes = 0;
                    res.on("data", (chunk) => {
                        bytes += chunk.length;
                    });
                    res.on("end", () => {
                        timings.end = performance.now();
                        const totalTime = timings.end - timings.start;
                        const latency = timings.response - timings.start;
                        const downloadSpeed = bytes / (totalTime / 1000);
                        resolve({
                            latency,
                            totalTime,
                            downloadSpeed,
                            dnsTime: timings.dnsTime,
                            tcpTime: timings.tcpTime,
                            endpointType,
                        });
                    });
                });
                req.on("error", (err) => {
                    resolve({
                        error: err.message,
                        dnsTime: timings.dnsTime,
                        tcpTime: timings.tcpTime,
                        endpointType,
                    });
                });
                req.on("timeout", () => {
                    req.destroy();
                    resolve({
                        error: "Timeout",
                        dnsTime: timings.dnsTime,
                        tcpTime: timings.tcpTime,
                        endpointType,
                    });
                });
            });
            socket.on("error", () => {
                resolve({
                    error: "TCP Connect Failed",
                    dnsTime: timings.dnsTime,
                    endpointType,
                });
            });
            socket.setTimeout(timeout, () => {
                socket.destroy();
                resolve({
                    error: "TCP Timeout",
                    dnsTime: timings.dnsTime,
                    endpointType,
                });
            });
        });
    });
}
export async function testRetrieval(cid, endpoints, config = {}) {
    const results = [];
    const concurrency = config.concurrency || 4;
    const retries = config.retries || 2;
    const timeout = config.timeout || 7000;
    async function testEndpoint(endpoint) {
        let attempts = 0;
        let lastError = "";
        let bestResult = {};
        for (let i = 0; i <= retries; i++) {
            attempts++;
            if (!isValidUrl(endpoint)) {
                return {
                    endpoint,
                    status: "Failed",
                    error: "Invalid URL",
                    attempts,
                    healthScore: 0,
                    endpointType: getEndpointType(endpoint),
                };
            }
            const metrics = await fetchWithAdvancedMetrics(endpoint, cid, timeout);
            if (!metrics.error) {
                const healthScore = Math.max(0, 100 - (metrics.latency || 0) / 100 - (attempts - 1) * 10);
                return {
                    endpoint,
                    status: "Success",
                    latency: metrics.latency,
                    downloadSpeed: metrics.downloadSpeed,
                    totalTime: metrics.totalTime,
                    attempts,
                    healthScore,
                    dnsTime: metrics.dnsTime,
                    tcpTime: metrics.tcpTime,
                    endpointType: metrics.endpointType,
                };
            }
            else {
                lastError = metrics.error || "";
                bestResult = metrics;
                await sleep(300 * 2 ** i);
            }
        }
        return {
            endpoint,
            status: "Failed",
            error: lastError,
            attempts,
            healthScore: 0,
            dnsTime: bestResult.dnsTime,
            tcpTime: bestResult.tcpTime,
            endpointType: bestResult.endpointType || getEndpointType(endpoint),
            ...bestResult,
        };
    }
    // Concurrency control
    const queue = [...endpoints];
    const running = [];
    async function worker() {
        while (queue.length) {
            const endpoint = queue.shift();
            if (!endpoint)
                break;
            const result = await testEndpoint(endpoint);
            results.push(result);
        }
    }
    for (let i = 0; i < concurrency; i++) {
        running.push(worker());
    }
    await Promise.all(running);
    return results;
}
//# sourceMappingURL=tester.js.map