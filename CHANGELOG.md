# Changelog

All notable changes to TARA Fusion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **SLSA Level 3 compliance** - Highest practical supply chain security
- Branch protection rules via `.github/settings.yml`
- CODEOWNERS file for required code reviews
- SLSA Level 3 setup and maintenance guide
- Comprehensive build automation with GitHub Actions
- SLSA verification documentation and guides
- Security policy (SECURITY.md) with Level 3 details
- Reproducible build script (scripts/build.sh)
- SHA-256 checksums for all release artifacts
- Cryptographic signing via Sigstore with Rekor transparency log

### Changed

- **Upgraded from SLSA Level 1 to Level 3**
- Updated CI workflow to include tests and security checks
- Enhanced README with SLSA Level 3 badge
- Improved release workflow with Level 3 provenance
- Updated all documentation to reflect Level 3 compliance

### Security

- **SLSA Level 3 features**:
  - Hardened build platform (GitHub-hosted runners)
  - Build isolation via SLSA GitHub Generator
  - Unforgeable provenance with Sigstore signing
  - Transparency log recording (Rekor)
  - Branch protection with required reviews
  - Code owner enforcement for critical files
- Implemented supply chain security best practices
- Added automated security audits in CI/CD
- All releases now include SLSA Level 3 provenance attestation

## Release Format

Each release will include:

- **Application Archive**: `tara-fusion-vX.Y.Z.tar.gz` and `.zip`
- **Checksums**: `checksums.txt` with SHA-256 hashes
- **Provenance**: `*.intoto.jsonl` SLSA attestation
- **Release Notes**: Detailed changelog and upgrade instructions

## Verification

All releases can be verified using:

```bash
# Verify checksums
sha256sum -c checksums.txt

# Verify SLSA provenance
slsa-verifier verify-artifact \
  --provenance-path *.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  tara-fusion-*.tar.gz
```

See [docs/SLSA-VERIFICATION.md](docs/SLSA-VERIFICATION.md) for detailed instructions.

---

[Unreleased]: https://github.com/patdhlk/tara-fusion/compare/v0.0.0...HEAD
