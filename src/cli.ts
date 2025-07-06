#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import { testRetrieval, defaultEndpoints } from "./tester";
import { formatResults } from "./formatter";

// Spinner utility
function createSpinner(msg: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let timer: NodeJS.Timeout;
  return {
    start() {
      process.stdout.write(chalk.cyanBright(frames[i] + " " + msg));
      timer = setInterval(() => {
        i = (i + 1) % frames.length;
        process.stdout.write("\r" + chalk.cyanBright(frames[i] + " " + msg));
      }, 80);
    },
    stop(finalMsg?: string) {
      clearInterval(timer);
      process.stdout.write("\r" + (finalMsg || "") + "\n");
    },
  };
}

// Welcome banner
function printWelcome() {
  console.log(
    chalk.bgCyanBright.bold("\n Filecoin Retrieval Tester ") +
      chalk.cyanBright(
        "\nA CLI tool to benchmark Filecoin/IPFS HTTP gateways and storage providers.\n"
      ) +
      chalk.white(
        "Test your CID across multiple endpoints, measure latency, DNS/TCP times, and reliability.\n"
      ) +
      chalk.gray("Run with --help for options and examples.\n")
  );
}

const cli = yargs(hideBin(process.argv))
  .scriptName("retrieval-tester")
  .usage(
    chalk.cyanBright("\nUsage:") +
      `\n  $ retrieval-tester --cid <cid> [options]\n`
  )
  .option("cid", {
    alias: "c",
    type: "string",
    describe: chalk.yellow("Filecoin CID to test"),
    demandOption: true,
  })
  .option("endpoints", {
    alias: "e",
    type: "array",
    describe: chalk.yellow("List of endpoints to test"),
    default: defaultEndpoints,
  })
  .option("format", {
    alias: "f",
    type: "string",
    describe: chalk.yellow("Output format: text or json"),
    default: "text",
    choices: ["text", "json"],
  })
  .option("concurrency", {
    alias: "n",
    type: "number",
    describe: chalk.yellow("Number of concurrent requests"),
    default: 4,
  })
  .option("retries", {
    alias: "r",
    type: "number",
    describe: chalk.yellow("Number of retries per endpoint"),
    default: 2,
  })
  .option("timeout", {
    alias: "t",
    type: "number",
    describe: chalk.yellow("Timeout per request in ms"),
    default: 7000,
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    describe: chalk.yellow("Enable verbose output"),
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

cli.command(
  "$0",
  chalk.magenta("Test Filecoin retrieval performance"),
  () => {},
  async (argv) => {
    printWelcome();

    // Validate CID
    if (!argv.cid || typeof argv.cid !== "string" || argv.cid.length < 10) {
      console.error(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(" Please provide a valid CID with --cid <cid>\n")
      );
      process.exit(1);
    }

    // Validate endpoints
    if (!Array.isArray(argv.endpoints) || argv.endpoints.length < 1) {
      console.error(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(
            " Please provide at least one endpoint with --endpoints\n"
          )
      );
      process.exit(1);
    }

    // Validate concurrency, retries, timeout
    const concurrency = argv.concurrency as number;
    const retries = argv.retries as number;
    const timeout = argv.timeout as number;

    if (isNaN(concurrency) || concurrency < 1) {
      console.error(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(" --concurrency must be a positive integer\n")
      );
      process.exit(1);
    }
    if (isNaN(retries) || retries < 0) {
      console.error(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(" --retries must be a non-negative integer\n")
      );
      process.exit(1);
    }
    if (isNaN(timeout) || timeout < 1000) {
      console.error(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(" --timeout must be at least 1000 ms\n")
      );
      process.exit(1);
    }

    console.log(
      chalk.greenBright(
        `🚀 Testing CID: ${chalk.bold(argv.cid)}\nEndpoints: ${chalk.bold(
          argv.endpoints.length
        )}, Concurrency: ${chalk.bold(concurrency)}, Retries: ${chalk.bold(
          retries
        )}, Timeout: ${chalk.bold(timeout)}ms`
      )
    );
    if (argv.verbose) {
      console.log(
        chalk.gray(
          `Endpoints: ${argv.endpoints
            .map((ep) => chalk.underline(ep as string))
            .join(", ")}`
        )
      );
    }

    // Loading spinner
    const spinner = createSpinner("Running retrieval tests...");
    spinner.start();
    let results;
    try {
      results = await testRetrieval(
        argv.cid as string,
        argv.endpoints as string[],
        {
          concurrency,
          retries,
          timeout,
        }
      );
      spinner.stop(chalk.greenBright("✔ Retrieval tests complete!\n"));
    } catch (err: any) {
      spinner.stop(
        chalk.bgRed.white.bold(" ERROR ") +
          chalk.redBright(" " + (err.message || "Unknown error"))
      );
      process.exit(1);
    }

    if (argv.format === "json") {
      // Show all fields in JSON output
      console.log(JSON.stringify(results, null, 2));
    } else {
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
      const rows = results.map((r) => [
        r.endpoint,
        r.endpointType || "Gateway",
        r.status,
        r.latency !== undefined ? `${r.latency.toFixed(1)}ms` : "-",
        r.dnsTime !== undefined ? `${r.dnsTime.toFixed(1)}` : "-",
        r.tcpTime !== undefined ? `${r.tcpTime.toFixed(1)}` : "-",
        r.attempts ?? "-",
        r.status === "Failed" ? r.error || "-" : "",
      ]);
      // Print table
      const pad = (str: string, len: number) => str.padEnd(len, " ");
      const colWidths = [28, 10, 9, 10, 9, 9, 8, 20];
      const printRow = (row: string[], colorFn = (x: string) => x) =>
        row
          .map((cell, i) => pad(cell, colWidths[i]))
          .join(" ")
          .replace(/Success/, chalk.green("Success"))
          .replace(/Failed/, chalk.red("Failed"));

      console.log(
        chalk.cyanBright(
          "\n" +
            printRow(header, chalk.bold) +
            "\n" +
            "-".repeat(colWidths.reduce((a, b) => a + b, 0) + header.length - 1)
        )
      );
      rows.forEach((row) => {
        // Color-code slow endpoints
        const latency = parseFloat(String(row[3] || "").replace("ms", "")) || 0;
        const dns = parseFloat(String(row[4])) || 0;
        const tcp = parseFloat(String(row[5])) || 0;
        let color = (x: string) => x;
        if (latency > 1000 || dns > 500 || tcp > 500) color = chalk.yellow;
        if (latency > 3000 || dns > 1500 || tcp > 1500) color = chalk.redBright;
        console.log(color(printRow(row.map(String))));
      });

      // Optionally, show verbose per-endpoint details
      if (argv.verbose) {
        results.forEach((r) => {
          console.log(
            chalk.gray(
              `\n[${r.endpointType || "Gateway"}] ${r.endpoint}\n  DNS: ${
                r.dnsTime !== undefined ? r.dnsTime.toFixed(1) + "ms" : "-"
              }, TCP: ${
                r.tcpTime !== undefined ? r.tcpTime.toFixed(1) + "ms" : "-"
              }, Latency: ${
                r.latency !== undefined ? r.latency.toFixed(1) + "ms" : "-"
              }, Attempts: ${r.attempts ?? "-"}${
                r.status === "Failed" && r.error ? `, Error: ${r.error}` : ""
              }`
            )
          );
        });
      }
    }

    // Print summary in text mode, including DNS/TCP stats
    if (argv.format === "text") {
      const latencies = results
        .filter((r) => r.latency !== undefined)
        .map((r) => r.latency!);
      const dnsTimes = results
        .filter((r) => r.dnsTime !== undefined)
        .map((r) => r.dnsTime!);
      const tcpTimes = results
        .filter((r) => r.tcpTime !== undefined)
        .map((r) => r.tcpTime!);

      function stats(arr: number[]) {
        if (!arr.length) return { avg: 0, min: 0, max: 0, median: 0 };
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const sorted = [...arr].sort((a, b) => a - b);
        const median =
          sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        return { avg, min, max, median };
      }

      const latencyStats = stats(latencies);
      const dnsStats = stats(dnsTimes);
      const tcpStats = stats(tcpTimes);

      // ASCII bar visualization
      function bar(val: number, max: number, width = 20) {
        const len = max ? Math.round((val / max) * width) : 0;
        return (
          chalk.cyanBright("▇".repeat(len)) +
          chalk.gray(".".repeat(width - len))
        );
      }

      const summary = {
        total: results.length,
        successes: results.filter((r) => r.status === "Success").length,
        failures: results.filter((r) => r.status === "Failed").length,
        avgLatency: latencyStats.avg,
        minLatency: latencyStats.min,
        maxLatency: latencyStats.max,
        medianLatency: latencyStats.median,
        avgDNS: dnsStats.avg,
        minDNS: dnsStats.min,
        maxDNS: dnsStats.max,
        medianDNS: dnsStats.median,
        avgTCP: tcpStats.avg,
        minTCP: tcpStats.min,
        maxTCP: tcpStats.max,
        medianTCP: tcpStats.median,
        successRate: results.length
          ? (results.filter((r) => r.status === "Success").length /
              results.length) *
            100
          : 0,
      };

      console.log(
        chalk.cyanBright(
          `\nSummary:\n  Total Tests: ${chalk.bold(
            summary.total
          )}\n  Successes: ${summary.successes}\n  Failures: ${
            summary.failures
          }\n  Success Rate: ${chalk.bold(
            summary.successRate.toFixed(1)
          )}%\n  Avg Latency: ${chalk.bold(
            summary.avgLatency.toFixed(2)
          )}ms ${bar(
            summary.avgLatency,
            summary.maxLatency
          )}\n  Min Latency: ${chalk.bold(
            summary.minLatency.toFixed(2)
          )}ms\n  Max Latency: ${chalk.bold(
            summary.maxLatency.toFixed(2)
          )}ms\n  Median Latency: ${chalk.bold(
            summary.medianLatency.toFixed(2)
          )}ms\n  Avg DNS: ${chalk.bold(summary.avgDNS.toFixed(2))}ms ${bar(
            summary.avgDNS,
            summary.maxDNS
          )}\n  Min DNS: ${chalk.bold(
            summary.minDNS.toFixed(2)
          )}ms\n  Max DNS: ${chalk.bold(
            summary.maxDNS.toFixed(2)
          )}ms\n  Median DNS: ${chalk.bold(
            summary.medianDNS.toFixed(2)
          )}ms\n  Avg TCP: ${chalk.bold(summary.avgTCP.toFixed(2))}ms ${bar(
            summary.avgTCP,
            summary.maxTCP
          )}\n  Min TCP: ${chalk.bold(
            summary.minTCP.toFixed(2)
          )}ms\n  Max TCP: ${chalk.bold(
            summary.maxTCP.toFixed(2)
          )}ms\n  Median TCP: ${chalk.bold(summary.medianTCP.toFixed(2))}ms`
        )
      );
    }
  }
);

cli.parse();
