# Contributing to TARA Fusion

Thank you for your interest in contributing to TARA Fusion! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Git**
- A **Gemini API key** for testing AI features (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/tara-fusion.git
   cd tara-fusion
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/uptux/tara-fusion.git
   ```

4. **Install dependencies**:

   ```bash
   # Install web app dependencies
   cd src
   npm install
   
   # Install Electron app dependencies (if working on desktop app)
   cd ../app
   npm install
   ```

5. **Set up environment variables**:

   ```bash
   # In the src directory
   cp .env.example .env.local
   # Edit .env.local and add your Gemini API key
   ```

6. **Start the development server**:

   ```bash
   cd src
   npm run dev
   ```

## How to Contribute

We welcome contributions in many forms:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- 🧪 **Tests**
- 🌍 **Translations** (i18n support)
- 💡 **Ideas and suggestions**

### First Time Contributors

Look for issues labeled with:

- `good first issue` - Great for newcomers
- `help wanted` - We'd love your help on these
- `documentation` - Documentation improvements

## Development Workflow

### Branch Strategy

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Keep your branch up to date**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Make your changes** with clear, focused commits

4. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

### Running Tests

Before submitting a pull request, ensure all tests pass:

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

### Type Checking

Ensure TypeScript types are correct:

```bash
npm run type-check
```

### Linting

Check and fix code style issues:

```bash
# Check for linting errors
npm run lint

# Automatically fix linting issues
npm run lint:fix
```

## Coding Standards

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Define types explicitly** - Avoid `any` types
- **Use interfaces** for object shapes
- **Use enums** for fixed sets of values
- **Export types** from `types.ts` for reusability

Example:

```typescript
interface MyComponentProps {
  title: string;
  onSave: (data: MyData) => void;
  items?: MyItem[];
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onSave, items = [] }) => {
  // Component implementation
};
```

### React Best Practices

- **Use functional components** with hooks
- **Use TypeScript** for prop types
- **Keep components focused** - Single responsibility
- **Extract reusable logic** into custom hooks
- **Use meaningful component names** - PascalCase for components
- **Organize imports** - React/third-party/local
- **Handle loading and error states**

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use them
- **Max line length**: 120 characters (flexible)
- **File naming**:
  - Components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
  - Tests: `ComponentName.test.tsx`

### Project Structure

```
src/
├── components/          # React components
│   ├── modals/         # Modal dialogs
│   ├── icons/          # Icon components
│   └── ...
├── services/           # Business logic layer
├── contexts/           # React contexts
├── data/              # Sample/demo data
├── locales/           # i18n translations
├── types.ts           # TypeScript type definitions
└── App.tsx            # Main application component
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(attack-trees): add support for custom attack potential factors

fix(assets): resolve issue with asset deletion not updating references

docs(readme): update installation instructions for Windows

test(risk-service): add unit tests for risk calculation
```

### Commit Best Practices

- **Write clear, descriptive messages**
- **Use present tense** ("add feature" not "added feature")
- **Reference issues** in footer (`Closes #123`, `Fixes #456`)
- **Keep commits focused** - One logical change per commit
- **Squash WIP commits** before submitting PR

## Pull Request Process

### Before Submitting a PR

1. ✅ **All tests pass**: `npm test`
2. ✅ **No linting errors**: `npm run lint`
3. ✅ **Types are correct**: `npm run type-check`
4. ✅ **Code is documented**: Add JSDoc comments for complex functions
5. ✅ **Changes are tested**: Add or update tests as needed
6. ✅ **Branch is up to date**: Rebase on latest `main`

### Submitting a Pull Request

1. **Push your branch** to your fork
2. **Open a Pull Request** against `main`
3. **Fill out the PR template** completely
4. **Link related issues** (e.g., "Closes #123")
5. **Request review** from maintainers
6. **Address feedback** promptly

### PR Title Format

Follow the same format as commit messages:

```
feat(scope): brief description of changes
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Motivation
Why is this change needed?

## Changes
- List of changes made
- Another change

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Changelog updated (if needed)
```

### Review Process

- PRs require **at least one approval** from a maintainer
- **CI must pass** before merging
- **Address all review comments** or explain why not
- Maintainers may request changes or tests
- Once approved, a maintainer will merge your PR

## Reporting Bugs

### Before Submitting a Bug Report

- **Check existing issues** - Your bug may already be reported
- **Try the latest version** - The bug might be fixed
- **Gather information** - Browser/OS, steps to reproduce, etc.

### Submitting a Bug Report

Use the **Bug Report** issue template and include:

1. **Clear title** - Summarize the problem
2. **Description** - What happened vs. what you expected
3. **Steps to reproduce** - Numbered list of exact steps
4. **Environment** - Browser, OS, Node.js version
5. **Screenshots** - If applicable
6. **Console errors** - Check browser dev tools
7. **Sample data** - If relevant to the bug

Example:

```markdown
**Bug**: Attack tree nodes disappear after refresh

**Steps to Reproduce**:
1. Create a new attack tree
2. Add several nodes
3. Refresh the page
4. Nodes are gone

**Expected**: Nodes should persist after refresh
**Actual**: All nodes are lost

**Environment**: Chrome 120, macOS 14.1, Node 18.17
```

## Suggesting Enhancements

We love hearing your ideas! When suggesting enhancements:

### Before Submitting

- **Check roadmap** - Feature might be planned
- **Search existing issues** - Might already be suggested
- **Consider scope** - Is it a core feature?

### Submitting an Enhancement

Use the **Feature Request** issue template and include:

1. **Clear title** - Describe the feature
2. **Problem statement** - What need does this address?
3. **Proposed solution** - How should it work?
4. **Alternatives** - Other approaches considered
5. **Use cases** - Real-world scenarios
6. **Mockups** - If UI related

## Development Tips

### Working with Attack Trees

The attack tree editor uses ReactFlow. Key files:

- `components/AttackTreeEditor.tsx` - Main editor
- `services/attackTreeService.ts` - Tree logic
- `services/attackTreeLayoutService.ts` - Layout algorithms

### AI Integration

AI features use Google's Gemini API:

- `services/geminiService.ts` - API integration
- Configure with `VITE_GEMINI_API_KEY` environment variable

### Testing Guidelines

- **Unit tests** for services and utilities
- **Component tests** for React components
- **Use testing-library** - Test user behavior, not implementation
- **Mock external dependencies** - API calls, etc.
- **Aim for >80% coverage** for new code

### Debugging

- Enable React DevTools browser extension
- Use console.log sparingly - prefer debugger or DevTools
- Check the browser console for errors
- Use TypeScript to catch errors early

## Community

### Getting Help

- 💬 **GitHub Discussions** - Ask questions, share ideas
- 🐛 **GitHub Issues** - Bug reports and feature requests
- 📧 **Email** - For security issues: <info@tara-fusion.com>

### Recognition

Contributors are recognized in:

- Project README
- Release notes
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TARA Fusion! 🙏

Your efforts help make security analysis more accessible and effective for everyone.
