# Filecoin Retrieval Tester CLI

A robust, extensible CLI tool for benchmarking and comparing Filecoin/IPFS HTTP gateway endpoints. Designed for Filecoin developers, node operators, and researchers to measure retrieval performance, reliability, and health across multiple endpoints.

---

## 📺 Demo

You can watch a demo of the CLI in action below:

<details>
<summary>Click to play demo video</summary>

![Demo Video](demo_video.mp4)

</details>

> ℹ️ If the video above does not play, try downloading it directly [here](demo_video.mp4).

---

## Features

- Test 10+ Filecoin/IPFS HTTP gateways in parallel
- Advanced metrics: latency, download speed, total time, DNS/TCP times, attempts, health score
- Configurable concurrency, retries, and timeout
- JSON and human-readable output formats
- Per-endpoint error handling and summary statistics
- Extensible TypeScript codebase

## Installation

```bash
npm install -g retrieval-tester
```

## Usage

```bash
retrieval-tester --cid Qm123...
```

## Options

- `--cid, -c <cid>`: **(required)** Filecoin CID to test
- `--endpoints, -e <urls...>`: List of endpoints to test (default: 10+ built-in gateways)
- `--format, -f <text|json>`: Output format (default: text)
- `--concurrency, -n <number>`: Number of parallel requests (default: 4)
- `--retries, -r <number>`: Retries per endpoint (default: 2)
- `--timeout, -t <ms>`: Timeout per request in ms (default: 7000)
- `--verbose, -v`: Enable verbose output
- `--version, -V`: Show version number
- `--help, -h`: Show help

## Installation & Usage (Development)

### Development (with ts-node)

```bash
npm install
npx ts-node src/index.ts --cid <CID>
```

### Production (build & run)

```bash
npm run build
node dist/index.js --cid <CID>
```

## CLI Options

- `--cid <cid>` (required): Filecoin CID to test
- `--endpoints <urls...>`: List of endpoints (default: 10+ built-in gateways)
- `--format <text|json>`: Output format (default: text)
- `--concurrency <n>`: Number of parallel requests (default: 4)
- `--retries <n>`: Retries per endpoint (default: 2)
- `--timeout <ms>`: Timeout per request in ms (default: 7000)

## Usage Examples

```bash
# Basic usage (text output)
npx retrieval-tester --cid Qm...

# JSON output
npx retrieval-tester --cid Qm... --format json > results.json

# Custom endpoints, concurrency, retries
npx retrieval-tester --cid Qm... --endpoints https://dweb.link https://ipfs.io --concurrency 8 --retries 3 --timeout 10000
```

## Contributing

1. Fork the repo and create a feature branch
2. Write clear, tested code and add/modify tests
3. Open a pull request with a detailed description

## License

MIT OR Apache-2.0 (see [LICENSE](https://github.com/Supercoolkayy/retrieval-tester/blob/main/LICENSE))  
© Abdulkareem Oyeneye (Dapps over Apps)

## Beta Testing & Feedback

This CLI is currently in **beta**.  
We welcome your feedback, bug reports, and suggestions!

- **Report issues or bugs:** [GitHub Issues](https://github.com/Supercoolkayy/retrieval-tester/issues)
- **Suggest features:** [GitHub Discussions](https://github.com/Supercoolkayy/retrieval-tester/discussions)
- **Contact maintainers:** Open an issue or discussion on GitHub.

Thank you for helping us improve!