# SLSA Level Comparison: Level 1 vs Level 3

This document shows what changed in the journey from SLSA Level 1 to Level 3.

## Quick Comparison

| Aspect | Level 1 | Level 3 |
|--------|---------|---------|
| **Build Automation** | ✅ Scripted | ✅ Scripted |
| **Provenance** | ✅ Generated | ✅ **Unforgeable** |
| **Build Service** | ✅ GitHub Actions | ✅ **Hardened** GitHub Actions |
| **Build Isolation** | ❌ Not required | ✅ **Isolated via SLSA Generator** |
| **Signing** | ✅ Sigstore | ✅ **Sigstore + Transparency Log** |
| **Branch Protection** | ❌ Not required | ✅ **Required reviews** |
| **Code Owners** | ❌ Not required | ✅ **Enforced** |
| **Security Level** | Basic | **Enterprise-Grade** |

## What Was Added for Level 2

### 1. Version Control Requirements

- **Branch Protection**: `.github/settings.yml`
  - Require pull request reviews
  - Require status checks to pass
  - Dismiss stale reviews
  - No force pushes

### 2. Code Review Process

- **CODEOWNERS**: `.github/CODEOWNERS`
  - Designated reviewers for critical files
  - Enforced reviews for workflows
  - Security-sensitive file protection

### 3. Build Service Authentication

- Already met via GitHub Actions
- Authenticated and authorized access
- Audit trail of all builds

## What Was Added for Level 3

### 1. Build Isolation

- **SLSA GitHub Generator v2.0.0**
  - Runs in separate isolated job
  - No access to repository secrets
  - Cannot be influenced by build script
  - Independent provenance generation

### 2. Unforgeable Provenance

- **Enhanced Signing**
  - Short-lived certificates
  - Keyless signing via Sigstore
  - Recorded in Rekor transparency log
  - Publicly verifiable

### 3. Hardened Build Platform

- **GitHub-Hosted Runners**
  - Regular security updates
  - Isolated per-build environments
  - Hardened by GitHub
  - Monitored and maintained

## Implementation Changes

### Workflow Changes

**Level 1 Workflow:**

```yaml
jobs:
  build:
    - Checkout
    - Build
    - Create artifacts
    - Upload provenance (basic)
  release:
    - Create release
```

**Level 3 Workflow:**

```yaml
jobs:
  build:
    - Checkout
    - Build (isolated)
    - Create artifacts
    - Generate hashes
  
  provenance:
    - Uses SLSA Generator (L3)
    - Signs with Sigstore
    - Records in Rekor
    - Isolated execution
  
  release:
    - Create release
    - Include L3 provenance
```

### Documentation Changes

**Added for Level 3:**

- `docs/SLSA-LEVEL3-SETUP.md` - Setup and maintenance guide
- `.github/settings.yml` - Branch protection configuration
- `.github/CODEOWNERS` - Code review requirements
- Enhanced SECURITY.md with L3 details
- Updated README with L3 badge and features

## Security Improvements

### Threat Mitigation

| Threat | Level 1 | Level 3 |
|--------|---------|---------|
| **Build Script Tampering** | Detected | **Prevented** |
| **Artifact Modification** | Detected | **Prevented** |
| **Provenance Forgery** | Detected | **Impossible** |
| **Insider Threats** | Limited | **Mitigated** |
| **Supply Chain Attacks** | Basic | **Strong Protection** |

### What Each Level Protects

**Level 1:**

- ✅ Documents what was built
- ✅ Shows build process
- ✅ Basic artifact verification

**Level 3 (adds):**

- ✅ Prevents build tampering
- ✅ Unforgeable provenance
- ✅ Build isolation guarantees
- ✅ Required reviews for changes
- ✅ Transparent audit trail
- ✅ Hardened build environment

## User Verification

### Level 1 Verification

```bash
# Basic verification
slsa-verifier verify-artifact \
  --provenance-path artifact.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  artifact.tar.gz
```

### Level 3 Verification

```bash
# Enhanced verification with additional guarantees
slsa-verifier verify-artifact \
  --provenance-path artifact.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  --source-tag v1.0.0 \
  artifact.tar.gz

# Verification confirms:
# ✅ Signature from Sigstore
# ✅ Transparency log entry (Rekor)
# ✅ Build isolation (SLSA L3 generator)
# ✅ Correct source and version
```

## Maintenance Differences

### Level 1 Maintenance

- Keep workflow updated
- Monitor build success
- Update dependencies

### Level 3 Maintenance (adds)

- **Review branch protection settings**
- **Update CODEOWNERS as team changes**
- **Monitor transparency logs**
- **Ensure required status checks pass**
- **Review and approve all PRs**
- **Keep SLSA generator version current**

## Cost/Benefit Analysis

### Level 1

**Effort**: Low

- Initial setup: ~2-4 hours
- Maintenance: Minimal

**Benefits**:

- Basic supply chain security
- Provenance generation
- Simple verification

### Level 3

**Effort**: Medium

- Initial setup: ~4-8 hours (includes L1)
- Maintenance: Low-Medium

**Benefits**:

- **Enterprise-grade security**
- **Unforgeable provenance**
- **Build isolation**
- **Required reviews**
- **Transparent audit trail**
- **Industry-leading protection**

**ROI**: Excellent for any project requiring:

- Security-critical applications
- Compliance requirements
- Customer trust
- Supply chain assurance

## When to Use Each Level

### Level 1 is Sufficient For

- Personal projects
- Internal tools
- Low-risk applications
- Getting started with SLSA

### Level 3 is Recommended For

- **Production applications**
- **Security-critical systems**
- **Commercial software**
- **Open source projects with many users**
- **Compliance requirements (SOC 2, ISO 27001)**
- **Any application requiring strong supply chain security**

## Migration Path

If you're currently at Level 1 and want to reach Level 3:

### Step 1: Enable Branch Protection

1. Create `.github/settings.yml`
2. Configure protection rules
3. Enable in GitHub repository settings

### Step 2: Add Code Owners

1. Create `.github/CODEOWNERS`
2. Assign reviewers for critical paths
3. Test PR review process

### Step 3: Update Workflow

1. Workflow already uses SLSA L3 generator
2. Update documentation to reflect L3
3. Test release process

### Step 4: Update Documentation

1. Update README badge (L1 → L3)
2. Enhance SECURITY.md
3. Create SLSA-LEVEL3-SETUP.md
4. Update all references to L1

**Total Time**: ~4 hours for existing L1 implementation

## Conclusion

**Level 1** provides basic supply chain security - a great starting point.

**Level 3** provides enterprise-grade security with:

- Unforgeable provenance
- Build isolation
- Required reviews
- Transparent audit trail

**The upgrade from L1 to L3** is straightforward and provides significant security benefits with minimal ongoing maintenance overhead.

**TARA Fusion Status**: ✅ **SLSA Level 3 Certified**

---

Last Updated: November 2025
