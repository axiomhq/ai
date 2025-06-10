# Axiom's CLI

A command-line interface for managing Axiom objects efficiently.

## Installation

```bash
npm install -g @axiomhq/cli
```

## Usage

```bash
axiom [command] [options]
```

## Available Commands

### List Objects

```bash
axiom list
```

Lists all available objects in your Axiom workspace.

### Push Objects

```bash
axiom push <object>
```

Push a new version of an object (prompt, eval, monitor, dashboard, etc.).

### Pull Objects

```bash
axiom pull <object>
```

Pull the latest version of an object from the workspace.

### Delete Objects

```bash
axiom delete <object>
```

Delete an object from your workspace.

## Global Options

- `--version`: Show CLI version
- `--help`: Show help information

## Development

To build the CLI locally:

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Run CLI
./dist/index.js
```

## License

MIT
