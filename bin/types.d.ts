export interface TestResult {
    endpoint: string;
    status: "Success" | "Failed";
    latency?: number;
    downloadSpeed?: number;
    totalTime?: number;
    error?: string;
    attempts: number;
    healthScore: number;
    dnsTime?: number;
    tcpTime?: number;
    endpointType?: string;
}
export interface TestStats {
    total: number;
    successes: number;
    failures: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    medianLatency: number;
    successRate: number;
}
export interface Config {
    endpoints: string[];
    concurrency: number;
    retries: number;
    timeout: number;
    logFile?: string;
}
