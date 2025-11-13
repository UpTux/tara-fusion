# GitHub Copilot Instructions for TARA Fusion

## Project Overview

TARA Fusion is an AI-powered web-based tool for conducting **Threat Analysis and Risk Assessment (TARA)** for security-critical systems. It combines traditional TARA methodologies with AI-powered threat intelligence using Google's Gemini API.

### Core Purpose
- Provide comprehensive security analysis and risk assessment
- Enable visual attack tree modeling with AI assistance
- Support multi-user collaboration with role-based access control
- Generate sphinx-needs compatible documentation

## Technology Stack

### Frontend Framework
- **React 19.2** with **TypeScript 5.8** (strict mode enabled)
- **Vite 7.2** for build tooling and development server
- **ReactFlow 11.11** for interactive attack tree visualization
- Component-based architecture with React hooks

### Key Libraries
- `@google/genai` - Gemini AI integration for threat analysis
- `html-to-image` - Export attack trees as images
- `jszip` - Project packaging and export
- `i18next` - Internationalization support
- `@mitre-attack/attack-data-model` - MITRE ATT&CK framework integration

### Testing & Quality
- **Vitest 4.0** for unit testing (271 tests currently passing)
- **@testing-library/react** for component testing
- **ESLint 9.0** with TypeScript and React plugins
- **@vitest/coverage-v8** for code coverage tracking

## Repository Structure

```
tara-fusion/
├── .devcontainer/          # Development container configuration
├── .github/
│   ├── workflows/          # CI/CD pipelines (ci.yml, coverage.yml, release.yml)
│   └── dependabot.yml      # Dependency update automation
├── docs/                   # Documentation (SBOM, traceability)
├── src/                    # Main source code (working directory for npm commands)
│   ├── components/         # React components
│   ├── contexts/           # React context providers
│   ├── services/           # Business logic and services
│   ├── locales/            # i18n translations
│   ├── types.ts            # TypeScript type definitions
│   └── package.json        # Dependencies and scripts
└── README.md               # Project documentation
```

**Important**: All npm commands must be run from the `./src` directory, not the root.

## Development Workflow

### Setup
```bash
cd src
npm ci                      # Install dependencies
```

### Development Commands (all run from ./src)
```bash
npm run dev                 # Start Vite dev server (localhost:5173)
npm run build               # Build for production
npm run preview             # Preview production build
npm run test                # Run tests in watch mode
npm run test:run            # Run tests once (CI mode)
npm run test:ui             # Run tests with UI
npm run lint                # Run ESLint
npm run lint:fix            # Fix auto-fixable linting issues
npm run type-check          # Run TypeScript type checking
```

### Environment Variables
Create `.env.local` in the `src/` directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Code Style & Conventions

### TypeScript
- Use strict TypeScript with explicit types
- Avoid `any` types - prefer proper typing
- Use functional components with TypeScript interfaces
- Path aliases: `@/*` maps to `./src/*`

### React Patterns
- Prefer functional components with hooks
- Use React 19.2 features appropriately
- Avoid calling setState directly within useEffect (see existing lint warnings)
- Follow component composition patterns
- Keep components focused and single-purpose

### File Organization
- Components in `components/` directory
- Services contain business logic separate from UI
- Context providers in `contexts/` directory
- Shared types in `types.ts`
- Test files colocated with source: `*.test.ts` or `*.test.tsx`

### Naming Conventions
- Components: PascalCase (e.g., `AttackTreeView.tsx`)
- Services: camelCase with Service suffix (e.g., `attackTreeService.ts`)
- Test files: match source file name with `.test` suffix
- Types/Interfaces: PascalCase

## Testing Requirements

### Test Coverage
- Maintain or improve existing test coverage (currently 271 passing tests)
- Write tests for new services and components
- Use Vitest and @testing-library/react patterns

### Test Patterns
```typescript
// Service tests
import { describe, it, expect } from 'vitest';
import { myService } from './myService';

describe('myService', () => {
  it('should handle expected behavior', () => {
    // Arrange, Act, Assert
  });
});

// Component tests
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Running Tests
```bash
cd src
npm run test:run          # Run all tests once
npm run test              # Watch mode
npm run test:ui           # Visual test UI
```

## Build & CI/CD

### CI Pipeline
The project uses GitHub Actions with three jobs:
1. **build**: Tests across Node 20.x, 22.x, 25.x
2. **lint**: ESLint and TypeScript type checking
3. **security**: npm audit and dependency checks

All CI jobs run from the `./src` directory.

### Building
```bash
cd src
npm run build             # Creates production build in src/dist/
```

Build requires `VITE_GEMINI_API_KEY` environment variable (can use dummy value for CI).

## Security Considerations

### API Keys
- Never commit API keys to source code
- Use environment variables via `.env.local` (gitignored)
- Gemini API key required for AI features

### Dependencies
- Dependabot configured for automatic security updates
- Weekly dependency updates on Mondays at 06:00
- npm audit runs in CI pipeline

### Best Practices
- Validate user inputs in services layer
- Sanitize data before rendering
- Follow React security best practices for XSS prevention
- Keep dependencies updated via Dependabot

## Domain-Specific Context

### TARA Concepts
- **TOE**: Target of Evaluation - the system being analyzed
- **Attack Trees**: Visual representation of attack paths using ReactFlow
- **Damage Scenarios**: Impact modeling across categories (Safety, Financial, Privacy)
- **Attack Potential**: 5-factor model (Time, Expertise, Knowledge, Access, Equipment)
- **Sphinx-needs**: Documentation format for export

### Key Features to Understand
1. **Asset Management**: Track critical assets with security properties (CIA+)
2. **Threat Modeling**: Systematic threat identification and analysis
3. **Attack Tree Editor**: Visual editor with AND/OR gates
4. **AI Integration**: Gemini-powered threat suggestions
5. **Role-Based Access**: Multi-organization with granular permissions
6. **Documentation Export**: Sphinx-needs and JSON formats

## Common Tasks

### Adding a New Component
1. Create in appropriate `components/` subdirectory
2. Use TypeScript with proper interfaces
3. Follow existing component patterns
4. Add tests in colocated `.test.tsx` file
5. Run `npm run lint` and `npm run type-check`

### Adding a New Service
1. Create in `services/` directory
2. Export functions with clear TypeScript types
3. Write comprehensive tests in `.test.ts` file
4. Ensure tests pass: `npm run test:run`

### Modifying Attack Tree Logic
- Core logic in `services/attackTreeService.ts`
- Layout in `services/attackTreeLayoutService.ts`
- UI in `components/AttackTreeView.tsx` and related components
- Always run tests after changes

### Adding AI Features
- Use `@google/genai` library
- Handle API errors gracefully
- Consider rate limiting
- Test with mock responses

## Troubleshooting

### Linting Errors
The codebase currently has some linting warnings (TypeScript no-explicit-any, no-non-null-assertion, etc.). These are tracked but non-blocking. Focus on not introducing new violations.

### Common Issues
- **"Cannot find module"**: Ensure you're in `./src` directory
- **Test failures**: Run `npm ci` to ensure clean dependencies
- **Build errors**: Check `VITE_GEMINI_API_KEY` is set (can use dummy value)
- **Type errors**: Run `npm run type-check` for detailed diagnostics

## Contributing Guidelines

1. Keep changes focused and minimal
2. Write or update tests for changes
3. Run full test suite before committing: `npm run test:run`
4. Run linting: `npm run lint`
5. Run type checking: `npm run type-check`
6. Ensure CI passes (build, lint, security jobs)
7. Follow existing code patterns and conventions

## Additional Resources

- Main README: `/README.md`
- CI Configuration: `.github/workflows/ci.yml`
- Type Definitions: `src/types.ts`
- Test Setup: `src/vitest.setup.ts`, `src/vitest.config.ts`
- ESLint Config: `src/eslint.config.js`
