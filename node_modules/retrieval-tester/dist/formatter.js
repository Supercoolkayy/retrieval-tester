"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResults = formatResults;
function formatResults(results, format) {
    if (format === "json") {
        return JSON.stringify(results, null, 2);
    }
    else {
        return results
            .map((result) => {
            var _a, _b, _c, _d, _e;
            if (result.status === "Success") {
                return `Endpoint: ${result.endpoint}\n  Status: Success\n  Latency: ${(_b = (_a = result.latency) === null || _a === void 0 ? void 0 : _a.toFixed(2)) !== null && _b !== void 0 ? _b : "N/A"}ms\n  Download Speed: ${result.downloadSpeed
                    ? (result.downloadSpeed / 1024).toFixed(2)
                    : "N/A"} KB/s\n  Total Time: ${(_d = (_c = result.totalTime) === null || _c === void 0 ? void 0 : _c.toFixed(2)) !== null && _d !== void 0 ? _d : "N/A"}ms\n  Attempts: ${result.attempts}\n  Health Score: ${result.healthScore}`;
            }
            else {
                return `Endpoint: ${result.endpoint}\n  Status: Failed\n  Error: ${(_e = result.error) !== null && _e !== void 0 ? _e : "Unknown error"}\n  Attempts: ${result.attempts}\n  Health Score: ${result.healthScore}`;
            }
        })
            .join("\n\n");
    }
}
