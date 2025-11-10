# SLSA Quick Reference

## 🚀 Quick Start

### For Developers

```bash
# Build locally with verification
./scripts/build.sh --verify

# Create a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# GitHub Actions will automatically build and create release
```

### For Users

```bash
# Download release
VERSION=v1.0.0
wget https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/tara-fusion-${VERSION}.tar.gz
wget https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/tara-fusion-${VERSION}.intoto.jsonl
wget https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/checksums.txt

# Verify checksum
sha256sum -c checksums.txt

# Verify provenance
slsa-verifier verify-artifact \
  --provenance-path tara-fusion-${VERSION}.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  tara-fusion-${VERSION}.tar.gz
```

## 📋 SLSA Levels

| Level | What it Means | TARA Fusion Status |
|-------|---------------|-------------------|
| 0 | No guarantees | ❌ |
| **1** | **Build documented** | **✅ Achieved** |
| 2 | Tamper-resistant service | 🎯 In progress |
| 3 | Hardened platform | 🎯 Provenance at L3 |
| 4 | Highest assurance | 🔮 Future |

## ✅ What SLSA L1 Guarantees

- ✅ Build process is automated and documented
- ✅ Artifacts are reproducible from source
- ✅ Build provenance is available
- ✅ Users can verify artifact authenticity

## 🔍 What to Check

### Build Process

- [ ] All steps are in `.github/workflows/release.yml`
- [ ] Build uses `npm ci` (reproducible installs)
- [ ] Dependencies locked in `package-lock.json`
- [ ] Tests pass before build

### Provenance

- [ ] Includes source commit SHA
- [ ] Identifies builder (GitHub Actions)
- [ ] Lists all materials (dependencies)
- [ ] Signed with Sigstore

### Release Artifacts

- [ ] Distribution archives (tar.gz, zip)
- [ ] SHA-256 checksums
- [ ] SLSA provenance (.intoto.jsonl)
- [ ] Release notes

## 🛠️ Commands

### Build Commands

```bash
# Local build
./scripts/build.sh

# Clean build with tests
./scripts/build.sh --clean --test --lint

# Full verification build
./scripts/build.sh --verify --version v1.0.0
```

### CI Commands

```bash
# Run tests
npm test

# Lint
npm run lint

# Type check
npm run type-check

# Full CI check
npm ci && npm run test:run && npm run lint:ci && npm run type-check
```

### Verification Commands

```bash
# Install verifier
go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest

# Verify artifact
slsa-verifier verify-artifact \
  --provenance-path FILE.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  ARTIFACT.tar.gz

# With specific tag
slsa-verifier verify-artifact \
  --provenance-path FILE.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  --source-tag v1.0.0 \
  ARTIFACT.tar.gz
```

## 📁 File Locations

```
.github/workflows/
  ├── ci.yml              # Continuous integration
  └── release.yml         # SLSA release workflow

scripts/
  └── build.sh            # Reproducible build script

docs/
  ├── SLSA-COMPLIANCE.md      # Compliance checklist
  ├── SLSA-VERIFICATION.md    # Verification guide
  └── SLSA-IMPLEMENTATION.md  # Implementation details

SECURITY.md             # Security policy
CHANGELOG.md           # Release history
README.md              # Project overview (with SLSA badge)
```

## 🔗 Important Links

- [SLSA Framework](https://slsa.dev)
- [SLSA Verifier](https://github.com/slsa-framework/slsa-verifier)
- [Sigstore](https://www.sigstore.dev/)
- [Releases](https://github.com/patdhlk/tara-fusion/releases)

## 🆘 Troubleshooting

### Verification Fails

```bash
# Re-download files
rm *.tar.gz *.intoto.jsonl checksums.txt
# Download again from GitHub Releases

# Check file integrity
file tara-fusion-*.tar.gz
sha256sum tara-fusion-*.tar.gz
```

### Build Fails

```bash
# Clean everything
rm -rf src/node_modules src/dist

# Reinstall
cd src && npm ci

# Build again
npm run build
```

### Provenance Issues

```bash
# Check provenance format
cat *.intoto.jsonl | jq .

# Verify structure
jq '.predicate.buildType' *.intoto.jsonl
jq '.subject' *.intoto.jsonl
```

## 📊 Success Indicators

✅ **Green CI badge** in README
✅ **SLSA Level 1 badge** displayed
✅ **All tests passing** in GitHub Actions
✅ **Provenance generated** for every release
✅ **Checksums match** on verification
✅ **slsa-verifier returns PASSED**

## 🎯 Next Steps

1. **Test the workflow**: Create a test release
2. **Verify locally**: Download and verify artifacts
3. **Document in wiki**: Add project-specific notes
4. **Train team**: Share verification process
5. **Monitor**: Track supply chain security

---

**Quick Help**: For detailed information, see:

- `SECURITY.md` - Security policy
- `docs/SLSA-*.md` - Complete documentation
- GitHub Issues - Report problems
