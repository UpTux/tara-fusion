# Sphinx Export Templates

This directory contains template files used by the Sphinx project export functionality.

## Templates

### `pyproject.toml.template`
Python project configuration file for the exported Sphinx documentation project. Defines dependencies and Python version requirements.

**Placeholders:** None (static template)

### `conf.py.template`
Sphinx configuration file for the documentation build system.

**Placeholders:**
- `{{PROJECT_NAME}}` - The name of the TARA project

### `index.rst.template`
Main index file for the Sphinx documentation.

**Placeholders:**
- `{{PROJECT_TITLE}}` - The formatted project title with RST header underline

## Usage

Templates are loaded at build time using Vite's `?raw` import feature:

```typescript
import pyprojectTomlTemplate from './templates/pyproject.toml.template?raw';
```

The templates are then processed by replacing placeholders with actual project data:

```typescript
const content = confPyTemplate.replace('{{PROJECT_NAME}}', projectName);
```

## Modifying Templates

When modifying templates:

1. Edit the `.template` files directly
2. Use `{{PLACEHOLDER_NAME}}` syntax for dynamic values
3. Ensure the corresponding replacement logic exists in `sphinxProjectExportService.ts`
4. Test the export functionality to verify the changes
