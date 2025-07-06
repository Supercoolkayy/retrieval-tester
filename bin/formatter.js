export function formatResults(results, format) {
    if (format === "json") {
        return JSON.stringify(results, null, 2);
    }
    else {
        return results
            .map((result) => {
            if (result.status === "Success") {
                return `Endpoint: ${result.endpoint}\n  Status: Success\n  Latency: ${result.latency?.toFixed(2) ?? "N/A"}ms\n  Download Speed: ${result.downloadSpeed
                    ? (result.downloadSpeed / 1024).toFixed(2)
                    : "N/A"} KB/s\n  Total Time: ${result.totalTime?.toFixed(2) ?? "N/A"}ms\n  Attempts: ${result.attempts}\n  Health Score: ${result.healthScore}`;
            }
            else {
                return `Endpoint: ${result.endpoint}\n  Status: Failed\n  Error: ${result.error ?? "Unknown error"}\n  Attempts: ${result.attempts}\n  Health Score: ${result.healthScore}`;
            }
        })
            .join("\n\n");
    }
}
//# sourceMappingURL=formatter.js.map