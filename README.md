# IB API Documentation

A Model Context Protocol (MCP) server that provides tools for retrieving documentation from Postman collections and generating AI actions.

## Features

- List and search Postman collections
- Navigate collection structures
- Get detailed request information
| - Comprehensive response example handling:
|   - List available response examples
|   - Get request details (focused on request information)
|   - Get detailed response example information
|   - Efficient workflow for accessing example data
- Generate code actions from Postman requests
- Optional integration with multiple AI frameworks
- TypeScript/JavaScript code generation

## Documentation

- [API Reference](API.md) - Detailed information about server tools and data structures
- [Configuration Guide](CONFIGURATION.md) - Server setup and configuration options
- [Prompt Templates](PROMPTS.md) - Examples and templates for using the tools
- [Update Instructions](UPDATING.md) - How to update your MCP server installation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ibproduct/ib-api-doc.git
cd ib-api-doc
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

### Development Workflow

1. Set up development environment:
```bash
# Clone and set up the repository
git clone https://github.com/ibproduct/ib-api-doc.git
cd ib-api-doc
npm install
```

2. Configure development server:
- Create a development configuration in your MCP settings file
- Point it to your local development build
- Include all tools in the alwaysAllow array

3. Development cycle:
```bash
# Make code changes
npm run build  # Build the changes
# Reload VSCode window to pick up new build
# Test using the development server configuration
# Repeat until satisfied with changes
```

4. Before committing:
- Test all affected functionality
- Update documentation if needed
- Follow the git workflow below

### Git Workflow

1. Before starting development:
```bash
git pull origin main
npm install  # If dependencies have changed
```

2. During development:
- The `.gitignore` file is configured to exclude:
  - Build artifacts (`build/`, `dist/`)
  - Dependencies (`node_modules/`)
  - Environment files (`.env*`)
  - IDE files (`.vscode/`, `.idea/`)
  - Logs and debug files
  - System files (`.DS_Store`, `Thumbs.db`)

3. Committing changes:
```bash
git add .  # Stage changes (respects .gitignore)
git commit -m "type: description

- Bullet points for specific changes
- Another change"
```

4. Pushing changes:
```bash
git pull origin main  # Get latest changes
git push origin main  # Push your changes
```

### Development Server

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
