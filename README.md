# TARA Fusion - AI-Powered Threat Analysis & Risk Assessment

[![CI](https://github.com/uptux/tara-fusion/actions/workflows/ci.yml/badge.svg)](https://github.com/uptux/tara-fusion/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/patdhlk/tara-fusion/graph/badge.svg?token=GWIX6DAEBT)](https://codecov.io/github/patdhlk/tara-fusion)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub issues](https://img.shields.io/github/issues/patdhlk/tara-fusion)](https://github.com/uptux/tara-fusion/issues)
[![GitHub stars](https://img.shields.io/github/stars/patdhlk/tara-fusion)](https://github.com/uptux/tara-fusion/stargazers)

TARA Fusion is a comprehensive web-based tool for conducting **Threat Analysis and Risk Assessment (TARA)** for security-critical systems. It combines traditional TARA methodologies with AI-powered threat intelligence using Google's Gemini API, providing an integrated environment for security analysis, risk assessment, and documentation generation.

**Available as:**

- 🌐 **Web Application** - Run in any modern browser
- 💻 **Desktop Application** - Native app for macOS, Windows, and Linux (see [Electron App](#electron-desktop-app))

---

## 🎯 Overview

TARA Fusion streamlines the security assessment process by providing:

- **Visual Attack Tree Editor** - Create and visualize attack paths with an intuitive graphical interface
- **AI-Powered Threat Generation** - Leverage Gemini AI to discover potential threats and attack scenarios
- **Comprehensive Risk Management** - Track threats, assets, damage scenarios, and mitigation strategies
- **Multi-User Collaboration** - Role-based access control for teams and organizations
- **Documentation Export** - Generate sphinx-needs compatible documentation for integration with technical documentation systems
- **Threat Catalog Management** - Build and maintain reusable threat catalogs

---

## ✨ Key Features

### 🛡️ Security Analysis

- **Asset Management** - Define and track critical assets with security properties (Confidentiality, Integrity, Availability, etc.)
- **Damage Scenarios** - Model potential impacts across customizable impact categories (Safety, Financial, Privacy, etc.)
- **Threat Modeling** - Systematically identify and analyze threats to your system
- **Threat Scenarios** - Create detailed attack scenarios with attack potential calculations
- **Misuse Cases** - Document ways the system could be misused or abused

### 🌳 Attack Tree Analysis

- **Graphical Attack Tree Editor** - Visual editor powered by ReactFlow for creating attack trees
- **Logic Gates** - Support for AND/OR gates to model attack path dependencies
- **Attack Potential Calculation** - Quantify attack feasibility using the 5-factor model (Time, Expertise, Knowledge, Access, Equipment)
- **Attack Feasibility Ratings** - Automatic calculation of attack feasibility from Very Low to High
- **Attack Leaves** - Identify and track atomic attack steps
- **Technical Attack Trees** - Model technical attack vectors and circumvention techniques

### 🤖 AI Integration

- **AI Threat Suggestions** - Generate contextual threat scenarios using Gemini AI
- **Intelligent Analysis** - Get AI-powered insights based on your asset definitions and security context
- **Threat Catalog Enhancement** - Automatically populate threat catalogs with relevant entries

### 📊 Risk Management

- **Risk Treatment Decisions** - Track how each risk will be handled (Reduce, Accept, Transfer, Avoid)
- **Security Goals & Controls** - Define and link security controls to mitigate identified threats
- **Security Claims** - Document security assumptions and responsibilities
- **Traceability** - Maintain complete traceability from threats to mitigations
- **Risk Level Visualization** - Automatic risk level calculation and visualization

### 👥 Collaboration & Access Control

- **Multi-Organization Support** - Manage multiple organizations and projects
- **Role-Based Permissions** - Granular access control at organization and project levels
  - Organization roles: Admin, CISO, Product Security Officer, User
  - Project roles: Project Admin, Designer, User, Viewer
- **User Management** - Centralized user and membership management
- **Project History** - Track all changes and updates to projects

### 📄 Documentation & Export

- **Sphinx-Needs Integration** - Export to sphinx-needs format for documentation systems
- **JSON Import/Export** - Save and load projects in portable JSON format
- **Management Summary** - Generate executive summaries of security analysis
- **Attack Tree Images** - Export attack trees as PNG images for reports
- **Markdown Support** - Rich text formatting with ReStructuredText support

### 🎨 Additional Features

- **TOE (Target of Evaluation) Description** - Document the system under analysis
- **Scope Definition** - Clearly define what's in and out of scope
- **Assumptions Management** - Track security assumptions across configurations
- **TOE Configuration Variants** - Analyze different system configurations
- **Project Cockpit** - Dashboard view of project status and metrics
- **Customizable Impact Categories** - Tailor impact categories to your domain (automotive, finance, healthcare, etc.)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Gemini API Key** (for AI-powered features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/uptux/tara-fusion.git
   cd tara-fusion
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your Gemini API key from: <https://aistudio.google.com/app/apikey>

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Code Quality

**Linting**

Run ESLint to check for code issues:

```bash
npm run lint
```

Automatically fix linting issues:

```bash
npm run lint:fix
```

**Type Checking**

Run TypeScript type checking:

```bash
npm run type-check
```

### Electron Desktop App

TARA Fusion is also available as a native desktop application for macOS, Windows, and Linux. The desktop app provides a better integrated experience with offline capabilities (except AI features).

#### Download Desktop App

Download pre-built desktop apps from the [Releases](https://github.com/uptux/tara-fusion/releases) page:

- **macOS**: Download `.dmg` file for your architecture (Intel, Apple Silicon, or Universal)
- **Windows**: Download `.exe` installer for your architecture (x64 or ARM64)
- **Linux**: Download `.AppImage`, `.deb`, or `.rpm` package for your architecture

#### Build Desktop App Locally

```bash
cd app

# Install dependencies
npm install

# Build for current platform
npm run build

# Or build for specific platform
npm run build:mac     # macOS
npm run build:win     # Windows
npm run build:linux   # Linux
```

For more details, see the [app/README.md](app/README.md).

---

## 🔐 Security & Supply Chain

TARA Fusion is **SLSA Level 3 compliant**, providing the highest level of supply chain security:

- ✅ **Fully Scripted Build**: Automated build process via GitHub Actions
- ✅ **Provenance Generation**: Every release includes SLSA Level 3 attestation
- ✅ **Non-Forgeable Provenance**: Cryptographically signed with Sigstore
- ✅ **Build Isolation**: Hardened build platform with GitHub-hosted runners
- ✅ **Verified Artifacts**: All releases include SHA-256 checksums
- ✅ **Reproducible Builds**: Locked dependencies ensure consistency
- ✅ **Branch Protection**: Required reviews and status checks
- ✅ **Transparent Audit Trail**: Complete build process documentation

### Verifying Release Artifacts

```bash
# Verify checksums
sha256sum -c checksums.txt

# Verify SLSA provenance (requires slsa-verifier)
slsa-verifier verify-artifact \
  --provenance-path *.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  tara-fusion-*.tar.gz
```

For detailed security information, see [SECURITY.md](SECURITY.md).

---

## �📖 Usage Guide

### Creating Your First TARA Project

1. **Select or Create an Organization** - Organizations group related projects
2. **Create a New Project** - Click the "+" button next to an organization
3. **Define the Target of Evaluation (TOE)** - Describe the system you're analyzing
4. **Set the Scope** - Clarify what's included and excluded from the analysis
5. **Identify Assets** - List critical assets and their security properties
6. **Model Damage Scenarios** - Define what could go wrong and the impact
7. **Identify Threats** - Systematically identify threats to each asset
8. **Create Attack Trees** - Visualize how attacks could be carried out
9. **Define Security Controls** - Document mitigations and security measures
10. **Export Documentation** - Generate sphinx-needs output for your documentation system

### Using the AI Threat Generator

1. Navigate to the **Threats** view
2. Click the **AI Threat Generator** button (sparkles icon)
3. Provide context about your system and assets
4. Review AI-generated threat scenarios
5. Accept, modify, or reject suggestions
6. Link threats to damage scenarios and security controls

### Working with Attack Trees

1. Navigate to **Attack Trees** view
2. Select a threat to edit its attack tree
3. Use the visual editor to:
   - Add attack nodes (AND/OR gates)
   - Define attack leaves with attack potential values
   - Connect nodes to show attack paths
   - Calculate overall attack feasibility
4. Export attack trees as images for reports

### Collaboration Features

- **Invite Users** - Add team members to organizations
- **Assign Roles** - Control who can view, edit, or manage projects
- **Share Projects** - Export projects as JSON to share with others
- **Track Changes** - Review project history to see what changed

---

## 🏗️ Technology Stack

### Frontend

- **React 19.2** - Modern UI framework
- **TypeScript 5.8** - Type-safe development
- **Vite 6.2** - Fast build tool and dev server
- **ReactFlow 11.11** - Interactive node-based diagrams
- **Tailwind CSS** - Utility-first styling (via inline classes)

### AI & Services

- **Google Gemini API** - AI-powered threat analysis
- **html-to-image** - Export attack trees as images
- **JSZip** - Project packaging and export

### Architecture

- **Component-based** - Modular, reusable React components
- **Service layer** - Separated business logic from UI
- **Type-safe** - Full TypeScript coverage
- **State management** - React hooks and context

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, your help is appreciated.

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/tara-fusion.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** and commit them with clear messages
5. **Push to your fork**: `git push origin feature/your-feature-name`
6. **Open a Pull Request** against the `main` branch

### Guidelines

Please read our [Contributing Guide](CONTRIBUTING.md) for detailed information on:

- Development setup and workflow
- Coding standards and best practices
- Testing requirements
- Commit message conventions
- Pull request process

### Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Good First Issues

New to the project? Look for issues labeled [`good first issue`](https://github.com/uptux/tara-fusion/labels/good%20first%20issue) - these are great starting points for contributors.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Attack tree visualization using [ReactFlow](https://reactflow.dev/)
- Documentation integration with [sphinx-needs](https://sphinx-needs.readthedocs.io/)

---

## 🔒 Security

Found a security vulnerability? Please read our [Security Policy](SECURITY.md) for responsible disclosure guidelines. Do not report security issues publicly.

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/uptux/tara-fusion/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/uptux/tara-fusion/discussions)
- **Email**: <info@tara-fusion.com>
- **Security Issues**: See [SECURITY.md](SECURITY.md)

---

## 📜 Citation

If you use TARA Fusion in your research or project, please cite:

```bibtex
@software{tara_fusion,
  title = {TARA Fusion: AI-Powered Threat Analysis \& Risk Assessment},
  author = {TARA Fusion Team},
  year = {2025},
  url = {https://github.com/uptux/tara-fusion},
  license = {MIT}
}
```

---

Happy Threat Modeling! 🛡️
