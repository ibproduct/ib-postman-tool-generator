# IB Postman Tool Generator

A Model Context Protocol (MCP) server that provides tools for retrieving documentation from Postman collections and generating AI actions.

## Features

- List and search Postman collections
- Navigate collection structures
- Get detailed request information
- Generate AI actions from Postman requests
- Support for multiple AI frameworks
- TypeScript/JavaScript code generation

## Documentation

- [Configuration Guide](CONFIGURATION.md)
- [Prompt Templates](PROMPTS.md)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ibproduct/ib-postman-tool-generator.git
cd ib-postman-tool-generator
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

4. Configure the server following the [Configuration Guide](CONFIGURATION.md)

## Usage

See the [Prompt Templates](PROMPTS.md) guide for detailed usage instructions and examples.

## Development

To run the server in development mode with automatic reloading:

```bash
npm run watch
```

To inspect the server's capabilities:

```bash
npm run inspector
```

## License

Private - IntelligenceBank © 2024
