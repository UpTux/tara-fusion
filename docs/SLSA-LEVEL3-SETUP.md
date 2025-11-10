# SLSA Level 3 Setup Guide

This guide explains how TARA Fusion achieved SLSA Level 3 compliance and how to maintain it.

## Overview

**SLSA Level 3** is the highest practical level of supply chain security, providing strong guarantees about build integrity and provenance authenticity.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SLSA Level 3 Build                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Developer pushes git tag (v1.0.0)                       │
│           ↓                                                   │
│  2. GitHub Actions triggered                                 │
│           ↓                                                   │
│  3. Build Job (Isolated Environment)                         │
│      - Checkout code                                          │
│      - Install dependencies (npm ci)                          │
│      - Run tests + lint + type-check                          │
│      - Build application                                      │
│      - Generate checksums                                     │
│           ↓                                                   │
│  4. SLSA Generator Job (Isolated)                            │
│      - Reads build outputs                                    │
│      - Generates provenance                                   │
│      - Signs with Sigstore                                    │
│      - Records in Rekor transparency log                      │
│           ↓                                                   │
│  5. Release Job                                              │
│      - Creates GitHub Release                                 │
│      - Uploads artifacts + provenance                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. GitHub Actions Workflow

**File**: `.github/workflows/release.yml`

**Key Features:**

- Uses SLSA GitHub Generator v2.0.0 (certified Level 3)
- Isolated build job with no secrets access
- Separate provenance generation job
- Immutable workflow in version control

**Critical Configuration:**

```yaml
provenance:
  uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
  permissions:
    actions: read
    id-token: write
    contents: write
```

### 2. Branch Protection

**File**: `.github/settings.yml`

**Requirements:**

- Require pull request reviews (minimum 1 approver)
- Require status checks to pass
- Dismiss stale reviews
- Require conversation resolution
- No force pushes
- No deletions

**How to Enable:**

1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable "Require pull request reviews before merging"
4. Enable "Require status checks to pass before merging"
5. Select required checks: build, lint, security

### 3. Code Owners

**File**: `.github/CODEOWNERS`

**Purpose:**

- Ensures critical files are reviewed by designated owners
- Enforces two-party review for security-sensitive changes

**Critical Paths:**

- `/.github/workflows/` - Workflow changes require review
- `/scripts/` - Build scripts require review
- `/src/package*.json` - Dependency changes require review

### 4. Build Isolation

**Provided by**: SLSA GitHub Generator

**Features:**

- Runs in separate isolated job
- No access to repository secrets
- Cannot be influenced by build script
- Provenance generation is independent

### 5. Cryptographic Signing

**Provider**: Sigstore

**How it Works:**

1. SLSA generator creates provenance
2. Signs with ephemeral key via Sigstore
3. Records signature in Rekor transparency log
4. Provenance includes certificate and transparency log entry

**Verification:**

```bash
slsa-verifier verify-artifact \
  --provenance-path artifact.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  artifact.tar.gz
```

## Level 3 Requirements Checklist

### Build Platform (L3.1)

- [x] **Hardened build platform**
  - ✅ GitHub-hosted runners
  - ✅ Regular security updates by GitHub
  - ✅ Isolated per-build environments

- [x] **Build isolation**
  - ✅ SLSA generator runs in separate job
  - ✅ Fresh container per build
  - ✅ No network access during provenance generation

### Provenance (L3.2)

- [x] **Unforgeable provenance**
  - ✅ Cryptographically signed with Sigstore
  - ✅ Short-lived certificates
  - ✅ Recorded in transparency log (Rekor)

- [x] **Provenance content**
  - ✅ Builder identity (workflow SHA)
  - ✅ Source repository and commit
  - ✅ Build parameters
  - ✅ Materials (dependencies)
  - ✅ Output artifacts with hashes

## Maintaining SLSA Level 3

### Daily Operations

1. **All changes via Pull Requests**
   - No direct commits to `main`
   - At least one approval required
   - All status checks must pass

2. **Review Requirements**
   - Code owner must approve changes to critical files
   - Security-sensitive changes need extra scrutiny

3. **Dependency Updates**
   - Review `package-lock.json` changes carefully
   - Use `npm audit` before merging
   - Verify package integrity

### Release Process

1. **Create Release Tag**

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Automated Build**
   - GitHub Actions workflow triggers automatically
   - Build runs in isolated environment
   - All quality checks must pass

3. **Provenance Generation**
   - SLSA generator creates provenance
   - Signs with Sigstore
   - Records in Rekor

4. **Release Publication**
   - Artifacts uploaded to GitHub Releases
   - Provenance included automatically
   - Checksums generated

### Monitoring

**Check these regularly:**

1. **Workflow Health**
   - All builds passing
   - No workflow failures
   - Generator version up-to-date

2. **Branch Protection**
   - Rules still enforced
   - No exceptions added
   - Status checks configured

3. **Security Updates**
   - GitHub Actions versions current
   - SLSA generator version current
   - Dependencies up-to-date

## Verification for Users

Users can verify Level 3 compliance:

```bash
# Install verifier
go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest

# Verify artifact
slsa-verifier verify-artifact \
  --provenance-path tara-fusion-v1.0.0.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  --source-tag v1.0.0 \
  tara-fusion-v1.0.0.tar.gz
```

Expected output includes:

```
Verified signature against tlog entry...
Verified build using builder "...slsa-github-generator...@refs/tags/v2.0.0"...
PASSED: Verified SLSA provenance
```

## What Level 3 Protects Against

✅ **Compromised Build Scripts**

- Build isolation prevents malicious build scripts from affecting provenance

✅ **Tampered Artifacts**

- Cryptographic signatures detect any modifications

✅ **Supply Chain Attacks**

- Provenance shows exact source and dependencies used

✅ **Insider Threats**

- Required reviews prevent unilateral malicious changes

✅ **Build Environment Compromise**

- Isolated environments limit blast radius

## What Level 3 Does NOT Protect Against

❌ **Malicious Source Code** (requires code review)
❌ **Compromised Dependencies** (requires dependency verification)
❌ **Social Engineering** (requires user awareness)
❌ **Zero-day Vulnerabilities** (requires patching)

## Upgrading to Level 4

SLSA Level 4 requires:

1. **Two-Party Review**
   - All changes require 2+ approvals
   - Different reviewers for different aspects

2. **Hermetic Builds**
   - Fully offline builds
   - All dependencies pinned with hashes
   - No network access during build

3. **Reproducible Builds**
   - Bit-for-bit reproducibility
   - Deterministic build process

**Current Status**: Level 4 is aspirational and rarely achieved in practice.

## Troubleshooting

### Provenance Generation Fails

**Symptoms**: SLSA generator job fails

**Solutions:**

1. Check `base64-subjects` format
2. Verify artifacts were uploaded
3. Check generator version compatibility
4. Review workflow permissions

### Verification Fails

**Symptoms**: `slsa-verifier` returns errors

**Solutions:**

1. Check artifact hash matches
2. Verify provenance file is complete
3. Ensure correct source URI
4. Check network connectivity to Rekor

### Branch Protection Issues

**Symptoms**: Can't merge PRs

**Solutions:**

1. Ensure all required checks pass
2. Get required approvals
3. Resolve conversations
4. Update branch with main

## Best Practices

1. **Keep Generator Updated**
   - Monitor SLSA generator releases
   - Update to latest stable version
   - Test in non-production first

2. **Regular Security Audits**
   - Review workflow permissions
   - Check branch protection settings
   - Verify CODEOWNERS is current

3. **Educate Team**
   - Train on SLSA concepts
   - Document review process
   - Share verification procedures

4. **Monitor Transparency Logs**
   - Check Rekor entries
   - Verify signature timestamps
   - Review certificate chains

## Resources

- [SLSA Specification](https://slsa.dev/spec/v1.0/)
- [SLSA GitHub Generator](https://github.com/slsa-framework/slsa-github-generator)
- [Sigstore Documentation](https://docs.sigstore.dev/)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)

## Support

For questions about SLSA Level 3 implementation:

1. Check [docs/SLSA-COMPLIANCE.md](SLSA-COMPLIANCE.md)
2. Review [SECURITY.md](../SECURITY.md)
3. Open an issue on GitHub

---

**SLSA Level 3 Certified** ✅

Last Updated: November 2025
