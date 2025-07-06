#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const chalk_1 = __importDefault(require("chalk"));
const tester_1 = require("./tester");
const cli = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .scriptName("retrieval-tester")
    .usage(chalk_1.default.cyanBright("\nUsage:") +
    `\n  $ retrieval-tester --cid <cid> [options]\n`)
    .option("cid", {
    alias: "c",
    type: "string",
    describe: chalk_1.default.yellow("Filecoin CID to test"),
    demandOption: true,
})
    .option("endpoints", {
    alias: "e",
    type: "array",
    describe: chalk_1.default.yellow("List of endpoints to test"),
    default: tester_1.defaultEndpoints,
})
    .option("format", {
    alias: "f",
    type: "string",
    describe: chalk_1.default.yellow("Output format: text or json"),
    default: "text",
    choices: ["text", "json"],
})
    .option("concurrency", {
    alias: "n",
    type: "number",
    describe: chalk_1.default.yellow("Number of concurrent requests"),
    default: 4,
})
    .option("retries", {
    alias: "r",
    type: "number",
    describe: chalk_1.default.yellow("Number of retries per endpoint"),
    default: 2,
})
    .option("timeout", {
    alias: "t",
    type: "number",
    describe: chalk_1.default.yellow("Timeout per request in ms"),
    default: 7000,
})
    .option("verbose", {
    alias: "v",
    type: "boolean",
    describe: chalk_1.default.yellow("Enable verbose output"),
    default: false,
})
    .version() // Use yargs built-in version
    .alias("version", "V")
    .example([
    [
        "retrieval-tester --cid Qm123...",
        "Test retrieval for a CID using default endpoints",
    ],
    ["retrieval-tester --cid Qm123... --format json", "Output results as JSON"],
    [
        "retrieval-tester --cid Qm123... --endpoints https://my.gateway.io",
        "Test a custom endpoint",
    ],
    [
        "retrieval-tester --cid Qm123... --concurrency 8 --retries 5",
        "Increase concurrency and retries",
    ],
])
    .help("help")
    .alias("help", "h")
    .wrap(Math.min(120, process.stdout.columns || 120))
    .strict();
cli.command("$0", chalk_1.default.magenta("Test Filecoin retrieval performance"), () => { }, (argv) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate CID
    if (!argv.cid || typeof argv.cid !== "string" || argv.cid.length < 10) {
        console.error(chalk_1.default.redBright("❌ Error: Please provide a valid CID with --cid <cid>"));
        process.exit(1);
    }
    // Validate endpoints
    if (!Array.isArray(argv.endpoints) || argv.endpoints.length < 1) {
        console.error(chalk_1.default.redBright("❌ Error: Please provide at least one endpoint with --endpoints"));
        process.exit(1);
    }
    // Validate concurrency, retries, timeout
    const concurrency = argv.concurrency;
    const retries = argv.retries;
    const timeout = argv.timeout;
    if (isNaN(concurrency) || concurrency < 1) {
        console.error(chalk_1.default.redBright("❌ Error: --concurrency must be a positive integer"));
        process.exit(1);
    }
    if (isNaN(retries) || retries < 0) {
        console.error(chalk_1.default.redBright("❌ Error: --retries must be a non-negative integer"));
        process.exit(1);
    }
    if (isNaN(timeout) || timeout < 1000) {
        console.error(chalk_1.default.redBright("❌ Error: --timeout must be at least 1000 ms"));
        process.exit(1);
    }
    console.log(chalk_1.default.greenBright(`🚀 Testing CID: ${chalk_1.default.bold(argv.cid)}\nEndpoints: ${chalk_1.default.bold(argv.endpoints.length)}, Concurrency: ${chalk_1.default.bold(concurrency)}, Retries: ${chalk_1.default.bold(retries)}, Timeout: ${chalk_1.default.bold(timeout)}ms`));
    if (argv.verbose) {
        console.log(chalk_1.default.gray(`Endpoints: ${argv.endpoints
            .map((ep) => chalk_1.default.underline(ep))
            .join(", ")}`));
    }
    const results = yield (0, tester_1.testRetrieval)(argv.cid, argv.endpoints, {
        concurrency,
        retries,
        timeout,
    });
    if (argv.format === "json") {
        // Show all fields in JSON output
        console.log(JSON.stringify(results, null, 2));
    }
    else {
        // Print detailed table with advanced metrics
        const header = [
            "Endpoint",
            "Type",
            "Status",
            "Latency",
            "DNS(ms)",
            "TCP(ms)",
            "Attempts",
            "Error",
        ];
        const rows = results.map((r) => {
            var _a;
            return [
                r.endpoint,
                r.endpointType || "Gateway",
                r.status,
                r.latency !== undefined ? `${r.latency.toFixed(1)}ms` : "-",
                r.dnsTime !== undefined ? `${r.dnsTime.toFixed(1)}` : "-",
                r.tcpTime !== undefined ? `${r.tcpTime.toFixed(1)}` : "-",
                (_a = r.attempts) !== null && _a !== void 0 ? _a : "-",
                r.status === "Failed" ? r.error || "-" : "",
            ];
        });
        // Print table
        const pad = (str, len) => str.padEnd(len, " ");
        const colWidths = [28, 10, 9, 10, 9, 9, 8, 20];
        const printRow = (row, colorFn = (x) => x) => row
            .map((cell, i) => pad(cell, colWidths[i]))
            .join(" ")
            .replace(/Success/, chalk_1.default.green("Success"))
            .replace(/Failed/, chalk_1.default.red("Failed"));
        console.log(chalk_1.default.cyanBright("\n" +
            printRow(header, chalk_1.default.bold) +
            "\n" +
            "-".repeat(colWidths.reduce((a, b) => a + b, 0) + header.length - 1)));
        rows.forEach((row) => {
            console.log(printRow(row.map(String)));
        });
        // Optionally, show verbose per-endpoint details
        if (argv.verbose) {
            results.forEach((r) => {
                var _a;
                console.log(chalk_1.default.gray(`\n[${r.endpointType || "Gateway"}] ${r.endpoint}\n  DNS: ${r.dnsTime !== undefined ? r.dnsTime.toFixed(1) + "ms" : "-"}, TCP: ${r.tcpTime !== undefined ? r.tcpTime.toFixed(1) + "ms" : "-"}, Latency: ${r.latency !== undefined ? r.latency.toFixed(1) + "ms" : "-"}, Attempts: ${(_a = r.attempts) !== null && _a !== void 0 ? _a : "-"}${r.status === "Failed" && r.error ? `, Error: ${r.error}` : ""}`));
            });
        }
    }
    // Print summary in text mode
    if (argv.format === "text") {
        const latencies = results
            .filter((r) => r.latency !== undefined)
            .map((r) => r.latency);
        const avgLatency = latencies.length
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;
        const minLatency = latencies.length ? Math.min(...latencies) : 0;
        const maxLatency = latencies.length ? Math.max(...latencies) : 0;
        const sorted = [...latencies].sort((a, b) => a - b);
        const medianLatency = latencies.length
            ? sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)]
            : 0;
        const summary = {
            total: results.length,
            successes: results.filter((r) => r.status === "Success").length,
            failures: results.filter((r) => r.status === "Failed").length,
            avgLatency,
            minLatency,
            maxLatency,
            medianLatency,
            successRate: results.length
                ? (results.filter((r) => r.status === "Success").length /
                    results.length) *
                    100
                : 0,
        };
        console.log(chalk_1.default.cyanBright(`\nSummary:\n  Total Tests: ${chalk_1.default.bold(summary.total)}\n  Successes: ${summary.successes}\n  Failures: ${summary.failures}\n  Success Rate: ${chalk_1.default.bold(summary.successRate.toFixed(1))}%\n  Avg Latency: ${chalk_1.default.bold(summary.avgLatency.toFixed(2))}ms\n  Min Latency: ${chalk_1.default.bold(summary.minLatency.toFixed(2))}ms\n  Max Latency: ${chalk_1.default.bold(summary.maxLatency.toFixed(2))}ms\n  Median Latency: ${chalk_1.default.bold(summary.medianLatency.toFixed(2))}ms`));
    }
}));
cli.parse();
//# sourceMappingURL=cli.js.map