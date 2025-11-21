# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The TARA Fusion team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by email to:

**<info@tara-fusion.com>**

Include as much of the following information as possible:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

After you submit a report, here's what happens:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours.

2. **Assessment**: We'll investigate and validate the issue, and provide an initial assessment within 5 business days.

3. **Fix Development**: We'll work on a fix. For complex issues, we may contact you for additional information.

4. **Release**: We'll release a patch and publish a security advisory. We aim to do this within 30 days for critical issues.

5. **Credit**: With your permission, we'll publicly thank you for the responsible disclosure.

### Security Best Practices for Users

When using TARA Fusion, follow these security best practices:

#### API Keys

- **Never commit API keys** to version control
- **Use environment variables** (`.env.local`) for API keys
- **Rotate keys regularly** if exposed
- **Limit key permissions** to minimum required scope

#### Data Protection

- **Sensitive Projects**: Be cautious about what data you store in projects
- **Export Security**: JSON exports may contain sensitive information
- **Access Control**: Use role-based permissions appropriately
- **Local Storage**: Browser storage is not encrypted

#### Deployment

- **HTTPS Only**: Always use HTTPS in production
- **Update Regularly**: Keep dependencies up to date
- **Review Dependencies**: Audit npm packages periodically
- **Secure Configuration**: Don't expose internal APIs

#### Electron Desktop App

- **Verify Downloads**: Only download from official GitHub releases
- **Code Signing**: Check signatures on macOS/Windows builds
- **Updates**: Keep the desktop app updated
- **Permissions**: Review app permissions on first run

## Known Security Considerations

### API Key Storage

The Gemini API key is stored in environment variables and accessed by the browser application. This means:

- Keys are visible in browser memory during runtime
- Keys should be treated as user-specific, not shared
- For production deployments, consider a backend proxy to hide API keys

### Data Storage

Project data is stored in:

- **Browser LocalStorage** for web version (not encrypted at rest)
- **Desktop App** uses Electron's safe storage where available

Sensitive information should be handled appropriately for your threat model.

### Third-Party Dependencies

This project relies on several third-party packages. We:

- Regularly update dependencies
- Monitor security advisories
- Use tools like `npm audit` to identify vulnerabilities

## Disclosure Policy

When we receive a security bug report, we:

1. Confirm the issue and determine affected versions
2. Audit code to find similar issues
3. Prepare fixes for all supported releases
4. Release patches as soon as possible
5. Publish a security advisory

## Security Advisories

Security advisories will be published:

- On the [GitHub Security Advisories](https://github.com/uptux/tara-fusion/security/advisories) page
- In release notes for patched versions
- As a pinned issue if critical

## Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts you own or have explicit permission to test
- Do not exploit a security issue beyond what is necessary to demonstrate it
- Report vulnerabilities promptly
- Keep vulnerability details confidential until we've addressed it

We will not pursue legal action against researchers who comply with this policy.

## Contact

For security-related questions or concerns:

- **Email**: <info@tara-fusion.com>
- **GitHub**: @patdhlk

---

Thank you for helping keep TARA Fusion and our users safe! 🛡️
