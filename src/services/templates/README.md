# Sphinx Export Templates

This directory contains template files used by the Sphinx project export functionality.

## Templates

### `pyproject.toml.template`

Python project configuration file for the exported Sphinx documentation project. Defines dependencies and Python version requirements.

**Placeholders:** None (static template)

### `ubproject.toml.template`

Sphinx and Sphinx-Needs configuration file. Contains all Sphinx extensions, theme settings, and Sphinx-Needs type/option/link definitions.

**Placeholders:**

- `{{PROJECT_NAME}}` - The name of the TARA project

### `conf.py.template`

Minimal Sphinx configuration file that references the ubproject.toml file for all configuration.

**Placeholders:** None (static template)

**Note:** Following Sphinx-Needs best practices, the conf.py file only contains:

```python
needs_from_toml = "ubproject.toml"
```

All Sphinx and Sphinx-Needs configuration is now in `ubproject.toml`. See: <https://sphinx-needs.readthedocs.io/en/latest/configuration.html#needs-from-toml>

### `index.rst.template`

Main index file for the Sphinx documentation.

**Placeholders:**

- `{{PROJECT_TITLE}}` - The formatted project title with RST header underline

## Usage

Templates are loaded at build time using Vite's `?raw` import feature:

```typescript
import pyprojectTomlTemplate from './templates/pyproject.toml.template?raw';
import ubprojectTomlTemplate from './templates/ubproject.toml.template?raw';
```

The templates are then processed by replacing placeholders with actual project data:

```typescript
const content = ubprojectTomlTemplate.replace('{{PROJECT_NAME}}', projectName);
```

## Modifying Templates

When modifying templates:

1. Edit the `.template` files directly
2. Use `{{PLACEHOLDER_NAME}}` syntax for dynamic values
3. Ensure the corresponding replacement logic exists in `sphinxProjectExportService.ts`
4. Test the export functionality to verify the changes
