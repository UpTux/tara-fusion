# SLSA Verification Quick Start

This guide helps you verify the integrity and provenance of TARA Fusion releases.

## Prerequisites

Install the SLSA verifier tool:

### macOS / Linux

```bash
# Using Go
go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest

# Or download pre-built binary
# macOS
wget https://github.com/slsa-framework/slsa-verifier/releases/latest/download/slsa-verifier-darwin-amd64
chmod +x slsa-verifier-darwin-amd64
sudo mv slsa-verifier-darwin-amd64 /usr/local/bin/slsa-verifier

# Linux
wget https://github.com/slsa-framework/slsa-verifier/releases/latest/download/slsa-verifier-linux-amd64
chmod +x slsa-verifier-linux-amd64
sudo mv slsa-verifier-linux-amd64 /usr/local/bin/slsa-verifier
```

### Windows

```powershell
# Download from GitHub releases
Invoke-WebRequest -Uri "https://github.com/slsa-framework/slsa-verifier/releases/latest/download/slsa-verifier-windows-amd64.exe" -OutFile "slsa-verifier.exe"
```

## Step-by-Step Verification

### 1. Download Release Assets

Go to [GitHub Releases](https://github.com/patdhlk/tara-fusion/releases) and download:

- `tara-fusion-vX.Y.Z.tar.gz` (or `.zip`)
- `checksums.txt`
- `tara-fusion-vX.Y.Z.intoto.jsonl`

### 2. Verify Checksums

First, verify the integrity of the downloaded files:

```bash
# Verify all checksums
sha256sum -c checksums.txt

# Or verify specific file
sha256sum tara-fusion-v*.tar.gz
# Compare output with checksums.txt
```

Expected output:

```
tara-fusion-v1.0.0.tar.gz: OK
```

### 3. Verify SLSA Provenance

Verify that the artifact was built by the expected workflow:

```bash
slsa-verifier verify-artifact \
  --provenance-path tara-fusion-v*.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  tara-fusion-v*.tar.gz
```

Expected output:

```
Verified signature against tlog entry index XXXXX at URL: https://rekor.sigstore.dev/api/v1/log/entries/...
Verified build using builder "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@refs/tags/v2.0.0" at commit XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Verifying artifact tara-fusion-v1.0.0.tar.gz: PASSED

PASSED: Verified SLSA provenance
```

### 4. Inspect Provenance (Optional)

To see detailed information about the build:

```bash
# Pretty-print the provenance
cat tara-fusion-v*.intoto.jsonl | jq .
```

Key fields to check:

- `subject`: The artifact that was built
- `predicate.builder.id`: The GitHub Actions workflow that built it
- `predicate.invocation`: Build parameters and entry point
- `predicate.metadata.buildStartedOn`: When the build started
- `predicate.materials`: Source code and dependencies used

## What This Verification Proves

When verification succeeds, you can be confident that:

✅ **Authenticity**: The artifact was built from the official TARA Fusion repository

✅ **Integrity**: The file hasn't been tampered with since it was built

✅ **Transparency**: The complete build process is documented

✅ **Reproducibility**: The build process can be independently verified

✅ **Non-Repudiation**: Cryptographic signatures prove the source

## Common Issues

### Issue: "Verification failed"

**Possible causes:**

- Downloaded incomplete or corrupted files
- Wrong version of provenance file
- Network issues during download

**Solution:**

- Re-download all files
- Ensure filenames match exactly
- Check file sizes against GitHub

### Issue: "slsa-verifier: command not found"

**Solution:**

- Install slsa-verifier (see Prerequisites above)
- Ensure it's in your PATH

### Issue: "Checksum mismatch"

**Solution:**

- Re-download the artifact
- Verify you downloaded the complete file
- Check network connection

## Advanced Verification

### Verify Specific Source Tag

```bash
slsa-verifier verify-artifact \
  --provenance-path tara-fusion-v1.0.0.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  --source-tag v1.0.0 \
  tara-fusion-v1.0.0.tar.gz
```

### Verify with Specific Builder

```bash
slsa-verifier verify-artifact \
  --provenance-path tara-fusion-v1.0.0.intoto.jsonl \
  --source-uri github.com/patdhlk/tara-fusion \
  --builder-id https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0 \
  tara-fusion-v1.0.0.tar.gz
```

## Automation

You can automate verification in your deployment scripts:

```bash
#!/bin/bash
set -e

VERSION="v1.0.0"
ARTIFACT="tara-fusion-${VERSION}.tar.gz"
PROVENANCE="tara-fusion-${VERSION}.intoto.jsonl"

# Download files
curl -LO "https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/${ARTIFACT}"
curl -LO "https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/${PROVENANCE}"
curl -LO "https://github.com/patdhlk/tara-fusion/releases/download/${VERSION}/checksums.txt"

# Verify checksum
echo "Verifying checksum..."
sha256sum -c checksums.txt --ignore-missing

# Verify provenance
echo "Verifying SLSA provenance..."
slsa-verifier verify-artifact \
  --provenance-path "${PROVENANCE}" \
  --source-uri github.com/patdhlk/tara-fusion \
  --source-tag "${VERSION}" \
  "${ARTIFACT}"

echo "✅ Verification successful! Safe to deploy."
```

## Additional Resources

- [SLSA Framework](https://slsa.dev)
- [SLSA Verifier Documentation](https://github.com/slsa-framework/slsa-verifier)
- [Sigstore](https://www.sigstore.dev/)
- [TARA Fusion Security Policy](../SECURITY.md)

## Support

If you encounter issues with verification:

1. Check the [GitHub Issues](https://github.com/patdhlk/tara-fusion/issues)
2. Review the [SECURITY.md](../SECURITY.md) documentation
3. Open a new issue with:
   - Release version
   - Verification command used
   - Complete error output
   - Operating system

---

Last Updated: November 2025
