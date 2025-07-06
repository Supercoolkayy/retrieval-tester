"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEndpoints = void 0;
exports.testRetrieval = testRetrieval;
const perf_hooks_1 = require("perf_hooks");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const dns = __importStar(require("dns"));
const net = __importStar(require("net"));
exports.defaultEndpoints = [
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
    catch (_a) {
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
function fetchWithAdvancedMetrics(endpoint, cid, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const timings = {};
            const url = `${endpoint.replace(/\/$/, "")}/ipfs/${cid}`;
            const endpointType = getEndpointType(endpoint);
            // DNS lookup
            const { hostname } = new URL(url);
            const dnsStart = perf_hooks_1.performance.now();
            dns.lookup(hostname, (err, address) => {
                const dnsEnd = perf_hooks_1.performance.now();
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
                const tcpStart = perf_hooks_1.performance.now();
                const socket = net.connect(port, address, () => {
                    const tcpEnd = perf_hooks_1.performance.now();
                    timings.tcpTime = tcpEnd - tcpStart;
                    socket.destroy();
                    // HTTP(S) request
                    let req;
                    const lib = url.startsWith("https") ? https : http;
                    const options = new URL(url);
                    const start = perf_hooks_1.performance.now();
                    timings.start = start;
                    req = lib.get(Object.assign(Object.assign({}, options), { timeout }), (res) => {
                        timings.response = perf_hooks_1.performance.now();
                        let bytes = 0;
                        res.on("data", (chunk) => {
                            bytes += chunk.length;
                        });
                        res.on("end", () => {
                            timings.end = perf_hooks_1.performance.now();
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
    });
}
function testRetrieval(cid_1, endpoints_1) {
    return __awaiter(this, arguments, void 0, function* (cid, endpoints, config = {}) {
        const results = [];
        const concurrency = config.concurrency || 4;
        const retries = config.retries || 2;
        const timeout = config.timeout || 7000;
        function testEndpoint(endpoint) {
            return __awaiter(this, void 0, void 0, function* () {
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
                    const metrics = yield fetchWithAdvancedMetrics(endpoint, cid, timeout);
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
                        yield sleep(300 * Math.pow(2, i));
                    }
                }
                return Object.assign({ endpoint, status: "Failed", error: lastError, attempts, healthScore: 0, dnsTime: bestResult.dnsTime, tcpTime: bestResult.tcpTime, endpointType: bestResult.endpointType || getEndpointType(endpoint) }, bestResult);
            });
        }
        // Concurrency control
        const queue = [...endpoints];
        const running = [];
        function worker() {
            return __awaiter(this, void 0, void 0, function* () {
                while (queue.length) {
                    const endpoint = queue.shift();
                    if (!endpoint)
                        break;
                    const result = yield testEndpoint(endpoint);
                    results.push(result);
                }
            });
        }
        for (let i = 0; i < concurrency; i++) {
            running.push(worker());
        }
        yield Promise.all(running);
        return results;
    });
}
//# sourceMappingURL=tester.js.map