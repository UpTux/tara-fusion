# TARA Fusion - AI-Powered Threat Analysis & Risk Assessment

[![CI](https://github.com/patdhlk/tara-fusion/actions/workflows/ci.yml/badge.svg)](https://github.com/patdhlk/tara-fusion/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![codecov](https://codecov.io/github/patdhlk/tara-fusion/graph/badge.svg?token=GWIX6DAEBT)](https://codecov.io/github/patdhlk/tara-fusion)

TARA Fusion is a comprehensive web-based tool for conducting **Threat Analysis and Risk Assessment (TARA)** for security-critical systems. It combines traditional TARA methodologies with AI-powered threat intelligence using Google's Gemini API, providing an integrated environment for security analysis, risk assessment, and documentation generation.

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
   git clone https://github.com/patdhlk/tara-fusion.git
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

---

## 📖 Usage Guide

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

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Attack tree visualization using [ReactFlow](https://reactflow.dev/)
- Documentation integration with [sphinx-needs](https://sphinx-needs.readthedocs.io/)

---

## 📧 Contact & Support

- **Repository**: [github.com/patdhlk/tara-fusion](https://github.com/patdhlk/tara-fusion)
- **Issues**: [GitHub Issues](https://github.com/patdhlk/tara-fusion/issues)

---

Happy Threat Modeling! 🛡️
