# Contributing to IB Postman Tool Generator

Thank you for your interest in contributing to the IB Postman Tool Generator! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/ibproduct/ib-postman-tool-generator.git
cd ib-postman-tool-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a configuration file:
- Copy `cline_mcp_settings.json.example` to your MCP settings directory
- Add your Postman API key

4. Run in development mode:
```bash
npm run watch
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (enforced by TypeScript compiler)
- Use meaningful variable and function names
- Add comments for complex logic
- Include type definitions for all functions and interfaces

## Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes:
- Follow the code style guidelines
- Update tests if necessary
- Update documentation as needed

3. Test your changes:
```bash
npm run build
npm run inspector  # Test MCP server capabilities
```

4. Commit your changes:
```bash
git add .
git commit -m "feat: description of your changes"
```

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add support for new AI framework
```

## Documentation

When making changes, update the relevant documentation:

- `README.md` for project-level changes
- `API.md` for API changes
- `CONFIGURATION.md` for configuration changes
- `PROMPTS.md` for new prompt templates
- Code comments for implementation details

## Testing

- Add tests for new features
- Update existing tests when modifying features
- Ensure all tests pass before submitting changes

## Pull Request Process

1. Update documentation
2. Run tests and ensure they pass
3. Push your changes:
```bash
git push origin feature/your-feature-name
```
4. Create a Pull Request:
   - Describe your changes
   - Reference any related issues
   - Include test results
   - List documentation updates

## Code Review

- All changes require code review
- Address review feedback promptly
- Keep discussions focused and professional
- Be open to suggestions and improvements

## Security

- Never commit API keys or credentials
- Use environment variables for sensitive data
- Report security issues privately to maintainers

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Review closed Pull Requests for similar changes
3. Open an issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the project's license.