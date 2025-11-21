# TARA Fusion Documentation

This directory contains the Sphinx-based documentation for TARA Fusion.

## Building the Documentation

### Prerequisites

- Python 3.9 or higher
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

Install uv if you haven't already:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with pip
pip install uv
```

### Build Instructions

1. **Install dependencies:**

```bash
cd docs
uv sync
```

2. **Build HTML documentation:**

```bash
uv run sphinx-build -b html . _build/html
```

3. **View documentation:**

Open `_build/html/index.html` in your browser.

### Development Mode

For live-reload during documentation editing:

```bash
# Install dev dependencies
uv sync --extra dev

# Run auto-build server
uv run sphinx-autobuild . _build/html
```

Then open <http://localhost:8000> in your browser. The documentation will rebuild automatically when you save changes.

## Building Other Formats

### PDF

```bash
uv run sphinx-build -b latex . _build/latex
cd _build/latex
make
```

### EPUB

```bash
uv run sphinx-build -b epub . _build/epub
```

### Man Pages

```bash
uv run sphinx-build -b man . _build/man
```

## Cleaning Build Artifacts

```bash
rm -rf _build
```

## Troubleshooting

### Missing Dependencies

If you get import errors:

```bash
uv sync --reinstall
```

### Build Errors

Check for syntax errors in RST files:

```bash
uv run sphinx-build -nW -b dummy . _build/dummy
```

### Broken Links

Check for broken external links:

```bash
uv run sphinx-build -b linkcheck . _build/linkcheck
```

## Contributing to Documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

### Documentation Style Guide

- Use **reStructuredText** (.rst) format
- Keep lines under 100 characters where possible
- Use proper heading hierarchy (=, -, ~, ^)
- Include code examples with syntax highlighting
- Add cross-references using `:doc:` and `:ref:`
- Write in clear, concise language
- Use active voice

### Adding New Pages

1. Create new .rst file in appropriate directory
2. Add to relevant toctree in index.rst or section index
3. Build and verify locally
4. Submit pull request

## License

This documentation is licensed under the MIT License - see [LICENSE](../LICENSE) for details.
