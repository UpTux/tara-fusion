# Software Bill of Materials (SBOM)

## Overview

TARA Fusion automatically generates comprehensive Software Bills of Materials (SBOMs) for every release. SBOMs provide complete transparency into the software supply chain by documenting all dependencies, licenses, and components.

## What is an SBOM?

A Software Bill of Materials is a formal, machine-readable inventory of all components used in building a software artifact. Think of it as an "ingredients list" for software.

### Why SBOMs Matter

- **Security**: Quickly identify vulnerable dependencies
- **Compliance**: Meet regulatory requirements (EO 14028, NTIA guidelines)
- **Transparency**: Full visibility into your software supply chain
- **Risk Management**: Track and manage component risks
- **License Compliance**: Ensure license compatibility

## Generated SBOM Formats

TARA Fusion releases include SBOMs in multiple industry-standard formats:

### 1. SPDX (Software Package Data Exchange)

- **Format**: JSON
- **Standard**: ISO/IEC 5962:2021
- **Files**:
  - `sbom-spdx.json` - Generated with npm tools
  - `sbom-syft-spdx.json` - Comprehensive scan with Syft
- **Best for**: Regulatory compliance, license tracking

### 2. CycloneDX

- **Format**: JSON and XML
- **Standard**: OWASP CycloneDX 1.4+
- **Files**:
  - `sbom-cyclonedx.json` - Generated with npm tools
  - `sbom-cyclonedx.xml` - XML format for legacy systems
  - `sbom-syft-cyclonedx.json` - Comprehensive scan with Syft
- **Best for**: Security scanning, vulnerability management

## Generation Tools

### npm-based Generation

Uses `@cyclonedx/cyclonedx-npm` to extract dependencies directly from `package-lock.json`.

**Advantages**:

- Direct from npm dependency tree
- Accurate version information
- Fast generation

### Syft Comprehensive Scan

Uses Anchore's [Syft](https://github.com/anchore/syft) to scan the entire source directory.

**Advantages**:

- Detects dependencies npm might miss
- Scans all file types
- Provides additional metadata
- Industry-standard tool

## SBOM Contents

Each SBOM includes:

### Required Elements (NTIA Minimum)

✅ **Supplier Name**: Package maintainers  
✅ **Component Name**: Package names  
✅ **Version**: Exact versions used  
✅ **Unique Identifier**: Package identifiers (purl)  
✅ **Dependency Relationships**: Component relationships  
✅ **Author of SBOM Data**: GitHub Actions  
✅ **Timestamp**: Generation time  

### Additional Information

- License identifiers (SPDX format)
- Component hashes (SHA-256, SHA-1)
- Package URLs (purl)
- Vulnerability metadata
- Direct vs transitive dependencies

## Using the SBOM

### 1. Vulnerability Scanning

#### Using Grype (Recommended)

```bash
# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Scan for vulnerabilities
grype sbom:./sbom-syft-spdx.json

# Output as JSON
grype sbom:./sbom-syft-spdx.json -o json

# Scan with specific severity threshold
grype sbom:./sbom-syft-spdx.json --fail-on high
```

#### Using npm audit

```bash
# Standard audit
npm audit

# Audit with JSON output
npm audit --json

# Fix vulnerabilities automatically
npm audit fix
```

### 2. Viewing SBOM Contents

#### Using Syft

```bash
# Install Syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# View SBOM in table format
syft sbom-syft-spdx.json

# Convert between formats
syft convert sbom-syft-spdx.json -o cyclonedx-json

# Filter by license
syft sbom-syft-spdx.json -o json | jq '.artifacts[] | select(.licenses[].value | contains("MIT"))'
```

#### Using jq for JSON SBOMs

```bash
# Count total components
jq '.packages | length' sbom-spdx.json

# List all licenses
jq '.packages[].licenseConcluded' sbom-spdx.json | sort -u

# Find specific package
jq '.packages[] | select(.name == "react")' sbom-spdx.json

# Extract dependency relationships
jq '.relationships[]' sbom-spdx.json
```

### 3. License Compliance

```bash
# Extract all licenses
jq '.packages[].licenseConcluded' sbom-spdx.json | sort | uniq -c

# Find packages with specific license
jq '.packages[] | select(.licenseConcluded | contains("GPL"))' sbom-spdx.json

# Check for license compatibility issues
# (requires additional tooling like SPDX License List)
```

### 4. Integration with CI/CD

```yaml
# Example: Scan SBOM in GitHub Actions
- name: Scan SBOM for vulnerabilities
  run: |
    curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
    grype sbom:./sbom-syft-spdx.json --fail-on critical
```

### 5. Supply Chain Security

```bash
# Check for known malicious packages
# (requires additional threat intelligence feeds)

# Verify package provenance
npm audit signatures

# Compare SBOMs between versions to detect changes
diff <(jq -S '.packages[] | .name' sbom-v1.json) \
     <(jq -S '.packages[] | .name' sbom-v2.json)
```

## Compliance Standards

TARA Fusion SBOMs comply with:

### ✅ NTIA Minimum Elements for SBOM

All required fields as defined by the National Telecommunications and Information Administration.

### ✅ Executive Order 14028

Meets U.S. government requirements for software supply chain security.

### ✅ SPDX 2.3 Specification

Follows the ISO/IEC 5962:2021 international standard.

### ✅ CycloneDX 1.4+ Specification

Adheres to OWASP's standard for software supply chain component analysis.

## Verification

### Verify SBOM Integrity

SBOMs are included in release artifacts with checksums:

```bash
# Download release and verify checksums
sha256sum -c checksums.txt

# Verify SBOM is included
ls -la sbom-*
```

### Validate SBOM Format

#### SPDX Validation

```bash
# Using SPDX tools
pip install spdx-tools
pyspdxtools -i sbom-spdx.json
```

#### CycloneDX Validation

```bash
# Using CycloneDX CLI
npm install -g @cyclonedx/cyclonedx-cli
cyclonedx validate --input-file sbom-cyclonedx.json
```

## Automated Updates

SBOMs are automatically generated for:

- ✅ Every tagged release (v*.*.*)
- ✅ Manual workflow dispatch releases
- ✅ Both SPDX and CycloneDX formats
- ✅ Multiple generation tools for comprehensive coverage

## Best Practices

### For Consumers

1. **Always download the SBOM** with the release artifacts
2. **Scan for vulnerabilities** before deployment using Grype or similar tools
3. **Review licenses** to ensure compliance with your policies
4. **Monitor dependencies** for security advisories
5. **Keep SBOMs archived** for audit and compliance purposes

### For Contributors

1. **Review dependency additions** - consider security and licensing
2. **Keep dependencies updated** - run `npm audit` regularly
3. **Minimize dependencies** - only add what's truly needed
4. **Document exceptions** - if vulnerable dependencies are unavoidable

### For Security Teams

1. **Set up automated scanning** - integrate Grype into your pipeline
2. **Create allow/deny lists** - define acceptable licenses and components
3. **Monitor CVE databases** - track known vulnerabilities
4. **Establish SLA** - define response times for critical vulnerabilities
5. **Maintain SBOM repository** - archive SBOMs for all deployed versions

## Tools Ecosystem

### Generation

- [@cyclonedx/cyclonedx-npm](https://github.com/CycloneDX/cyclonedx-node-npm) - npm SBOM generator
- [Syft](https://github.com/anchore/syft) - Universal SBOM generator
- [SPDX Tools](https://github.com/spdx/tools) - SPDX utilities

### Analysis

- [Grype](https://github.com/anchore/grype) - Vulnerability scanner
- [OSV Scanner](https://github.com/google/osv-scanner) - Google's vulnerability scanner
- [Trivy](https://github.com/aquasecurity/trivy) - Comprehensive security scanner

### Validation

- [SPDX Online Tools](https://tools.spdx.org/app/) - SPDX validation
- [CycloneDX CLI](https://github.com/CycloneDX/cyclonedx-cli) - CycloneDX validation

### Management

- [Dependency-Track](https://dependencytrack.org/) - SBOM analysis platform
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) - Dependency analyzer

## Resources

### Standards Documentation

- [SPDX Specification](https://spdx.dev/specifications/)
- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [NTIA SBOM Minimum Elements](https://www.ntia.gov/files/ntia/publications/sbom_minimum_elements_report.pdf)

### Regulatory Guidance

- [Executive Order 14028](https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/)
- [CISA SBOM Resources](https://www.cisa.gov/sbom)

### Community

- [SPDX Community](https://spdx.dev/participate/)
- [CycloneDX Community](https://cyclonedx.org/about/participate/)
- [OpenSSF](https://openssf.org/) - Open Source Security Foundation

## FAQ

### Q: Which SBOM format should I use?

**A**: Both formats serve different purposes:

- Use **SPDX** for regulatory compliance and license tracking
- Use **CycloneDX** for vulnerability management and security scanning
- Download both if your tools support multiple formats

### Q: How often are SBOMs updated?

**A**: SBOMs are generated fresh for every release. Between releases, you can generate your own using the tools mentioned above.

### Q: Can I generate an SBOM locally?

**A**: Yes! See the Generation Tools section above. Run the same commands used in the CI/CD pipeline.

### Q: What if I find a vulnerability in the SBOM?

**A**: Report security issues via GitHub Security Advisories or email the maintainers. See SECURITY.md for details.

### Q: Are development dependencies included?

**A**: Yes, all dependencies (production and development) are included in the SBOM. Filter them using the SBOM metadata if needed.

### Q: How do I know if the SBOM is complete?

**A**: We use multiple generation tools (npm + Syft) to ensure comprehensive coverage. Compare the different SBOM files to verify completeness.

---

**Last Updated**: Generated automatically with each release  
**Maintainer**: TARA Fusion Team  
**License**: See LICENSE file in repository
