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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const tester_1 = require("./tester");
const formatter_1 = require("./formatter");
const program = new commander_1.Command();
program
    .name("retrieval-tester")
    .description("CLI tool to test Filecoin retrieval performance")
    .version("0.2.0")
    .requiredOption("--cid <cid>", "Filecoin CID to test")
    .option("--endpoints <endpoints...>", "List of endpoints to test", tester_1.defaultEndpoints)
    .option("--format <format>", "Output format: text or json", "text")
    .option("--concurrency <n>", "Number of concurrent requests", (v) => parseInt(v, 10), 4)
    .option("--retries <n>", "Number of retries per endpoint", (v) => parseInt(v, 10), 2)
    .option("--timeout <ms>", "Timeout per request in ms", (v) => parseInt(v, 10), 7000)
    .addHelpText("after", `
Example:
  retrieval-tester --cid Qm123... --format text

Options:
  --cid <cid>           CID to test (required)
  --endpoints <urls...> List of endpoints (default: 10+ built-in gateways)
  --format <text|json>  Output format (default: text)
  --concurrency <n>     Number of parallel requests (default: 4)
  --retries <n>         Retries per endpoint (default: 2)
  --timeout <ms>        Timeout per request in ms (default: 7000)
  -h, --help            Display help for command
`);
if (process.argv.length <= 2) {
    program.outputHelp((txt) => chalk_1.default.cyan(txt));
    process.exit(0);
}
program.parse(process.argv);
const options = program.opts();
// Validate CID
// NOTE: The CID must be at least 10 characters. For testing, use a longer CID or adjust the length below.
if (!options.cid ||
    typeof options.cid !== "string" ||
    options.cid.length < 10 // Change '10' to a lower value if you want to allow shorter CIDs for testing
) {
    console.error(chalk_1.default.red("❌ Error: Please provide a valid CID with --cid <cid>"));
    process.exit(1);
}
// Validate format
if (!["text", "json"].includes(options.format)) {
    console.error(chalk_1.default.red("❌ Error: --format must be 'text' or 'json'"));
    process.exit(1);
}
// Validate endpoints
if (!Array.isArray(options.endpoints) || options.endpoints.length < 1) {
    console.error(chalk_1.default.red("❌ Error: Please provide at least one endpoint with --endpoints"));
    process.exit(1);
}
// Validate concurrency, retries, timeout
if (isNaN(options.concurrency) || options.concurrency < 1) {
    console.error(chalk_1.default.red("❌ Error: --concurrency must be a positive integer"));
    process.exit(1);
}
if (isNaN(options.retries) || options.retries < 0) {
    console.error(chalk_1.default.red("❌ Error: --retries must be a non-negative integer"));
    process.exit(1);
}
if (isNaN(options.timeout) || options.timeout < 1000) {
    console.error(chalk_1.default.red("❌ Error: --timeout must be at least 1000 ms"));
    process.exit(1);
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.greenBright(`Testing CID: ${options.cid}`));
    const results = yield (0, tester_1.testRetrieval)(options.cid, options.endpoints, {
        concurrency: options.concurrency,
        retries: options.retries,
        timeout: options.timeout,
    });
    const output = (0, formatter_1.formatResults)(results, options.format);
    if (options.format === "json") {
        console.log(output);
    }
    else {
        console.log(chalk_1.default.white(output));
    }
    // Print summary in text mode
    if (options.format === "text") {
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
        console.log(chalk_1.default.cyanBright(`\nSummary:\n  Total Tests: ${summary.total}\n  Successes: ${summary.successes}\n  Failures: ${summary.failures}\n  Success Rate: ${summary.successRate.toFixed(1)}%\n  Avg Latency: ${summary.avgLatency.toFixed(2)}ms\n  Min Latency: ${summary.minLatency.toFixed(2)}ms\n  Max Latency: ${summary.maxLatency.toFixed(2)}ms\n  Median Latency: ${summary.medianLatency.toFixed(2)}ms`));
    }
}))();
