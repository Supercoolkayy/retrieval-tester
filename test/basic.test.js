const { testRetrieval, defaultEndpoints } = require("../dist/tester");

(async () => {
  const results = await testRetrieval(
    "QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u",
    defaultEndpoints,
    { concurrency: 2, retries: 0, timeout: 2000 }
  );
  if (!Array.isArray(results)) {
    throw new Error("Results should be an array");
  }
  if (results.length !== defaultEndpoints.length) {
    throw new Error("Should test all endpoints");
  }
  if (
    !("dnsTime" in results[0]) ||
    !("tcpTime" in results[0]) ||
    !("endpointType" in results[0])
  ) {
    throw new Error("Advanced metrics or endpoint type missing in results");
  }
  console.log("Basic regression test passed.");
})();
