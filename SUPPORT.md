# Support

Thank you for using TARA Fusion! This document provides guidance on how to get help.

## 📚 Documentation

Before seeking help, please check our documentation:

- **README**: [Main documentation](README.md) with feature overview and getting started guide
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md) for development setup
- **Security Policy**: [SECURITY.md](SECURITY.md) for security-related issues
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) for version history and changes

## 💬 Getting Help

### GitHub Discussions

For questions, ideas, and community support:

👉 [Start a Discussion](https://github.com/uptux/tara-fusion/discussions)

Use discussions for:

- Questions about usage ("How do I...?")
- Feature ideas and brainstorming
- Sharing your TARA projects or success stories
- General feedback

### GitHub Issues

For bug reports and feature requests:

👉 [Open an Issue](https://github.com/uptux/tara-fusion/issues/new/choose)

Please use the appropriate issue template:

- **Bug Report**: For unexpected behavior or errors
- **Feature Request**: For suggesting new features or enhancements

### Email Support

For private inquiries or partnership opportunities:

📧 <info@tara-fusion.com>

Response time: Within 5 business days

## 🐛 Reporting Bugs

When reporting a bug, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (browser, OS, version)
5. **Screenshots** if applicable
6. **Console errors** from browser developer tools

See our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) for details.

## 🔒 Security Vulnerabilities

**DO NOT report security issues publicly!**

Please see our [Security Policy](SECURITY.md) for responsible disclosure:

📧 Security email: <info@tara-fusion.com>

## 🌟 Feature Requests

We welcome feature suggestions! When requesting a feature:

1. **Check existing requests** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with examples
4. **Explain use cases** where this would be helpful

See our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml) for details.

## 🤝 Contributing

Want to contribute code, documentation, or translations?

See our [Contributing Guide](CONTRIBUTING.md) for:

- Development setup
- Coding standards
- Pull request process
- First-time contributor tips

## 📦 Installation Help

### Common Installation Issues

**Problem**: `npm install` fails with permission errors

**Solution**:

```bash
# Use npm's built-in fix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use nvm to manage Node.js versions
```

**Problem**: `Cannot find module 'vite'`

**Solution**:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Gemini API key not working

**Solution**:

- Verify the key is correct at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check that `.env.local` file exists and contains `VITE_GEMINI_API_KEY=your_key`
- Restart the dev server after adding the key

### Electron App Issues

**Problem**: Desktop app won't start

**Solution**:

```bash
cd app
rm -rf node_modules package-lock.json
npm install
```

**Problem**: White screen in desktop app

**Solution**: This was fixed in v0.1.0. Please update to the latest version.

## 🔍 Troubleshooting

### Development Server Won't Start

1. Check Node.js version: `node --version` (requires v18+)
2. Clear cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`

### Build Fails

1. Run type check: `npm run type-check`
2. Run linter: `npm run lint`
3. Check for console errors during build

### Tests Failing

1. Update dependencies: `npm install`
2. Clear test cache: `npx vitest --clearCache`
3. Run tests in UI mode: `npm run test:ui`

## 📖 Additional Resources

### Community Resources

- **GitHub Repository**: [uptux/tara-fusion](https://github.com/uptux/tara-fusion)
- **Issue Tracker**: [GitHub Issues](https://github.com/uptux/tara-fusion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/uptux/tara-fusion/discussions)

### Related Documentation

- [ReactFlow Documentation](https://reactflow.dev/)
- [sphinx-needs Documentation](https://sphinx-needs.readthedocs.io/)
- [ISO/SAE 21434 Standard](https://www.iso.org/standard/70918.html)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [MITRE Emb3d](https://emb3d.mitre.org/)

## 🕐 Response Times

- **Bug Reports**: Triaged within 3 business days
- **Feature Requests**: Reviewed within 1 week
- **Pull Requests**: Initial review within 5 business days
- **Security Issues**: Acknowledged within 48 hours
- **General Questions**: Best effort basis

## 🙏 Thank You

Thank you for using TARA Fusion and being part of our community!

Your feedback and contributions help make this tool better for everyone.

---

**Still need help?** Open a [GitHub Discussion](https://github.com/uptux/tara-fusion/discussions) and we'll assist you!
