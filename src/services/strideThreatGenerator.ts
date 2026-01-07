import { Asset, SecurityProperty, StrideCategory, StrideThreat, DreadRating } from '../types';
import { createDefaultDreadRating } from './strideDreadService';

/**
 * STRIDE Threat Generator Service
 *
 * Generates STRIDE threats based on assets and their security properties.
 * Maps security properties to appropriate STRIDE categories and creates
 * relevant threat scenarios.
 */

// Mapping between security properties and STRIDE categories
export const securityPropertyToStrideMapping: Record<SecurityProperty, StrideCategory> = {
  [SecurityProperty.AUTHENTICITY]: StrideCategory.SPOOFING,
  [SecurityProperty.INTEGRITY]: StrideCategory.TAMPERING,
  [SecurityProperty.NON_REPUDIATION]: StrideCategory.REPUDIATION,
  [SecurityProperty.CONFIDENTIALITY]: StrideCategory.INFORMATION_DISCLOSURE,
  [SecurityProperty.AVAILABILITY]: StrideCategory.DENIAL_OF_SERVICE,
  [SecurityProperty.AUTHORIZATION]: StrideCategory.ELEVATION_OF_PRIVILEGE,
  [SecurityProperty.CORRECTNESS]: StrideCategory.TAMPERING, // Correctness maps to data tampering
  [SecurityProperty.FRESHNESS]: StrideCategory.SPOOFING, // Replay attacks are a form of spoofing
};

// Threat templates for each STRIDE category
interface ThreatTemplate {
  nameTemplate: string;
  descriptionTemplate: string;
  threatAgents: string[];
  attackVectors: string[];
  defaultDreadRating: DreadRating;
}

const threatTemplates: Record<StrideCategory, ThreatTemplate[]> = {
  [StrideCategory.SPOOFING]: [
    {
      nameTemplate: 'Spoofing of {asset} identity',
      descriptionTemplate: 'An attacker could impersonate {asset} by forging authentication credentials or certificates.',
      threatAgents: ['External attacker', 'Malicious insider', 'Compromised system'],
      attackVectors: ['Network', 'Credential theft', 'Certificate forgery'],
      defaultDreadRating: { damage: 7, reproducibility: 6, exploitability: 5, affectedUsers: 7, discoverability: 5 },
    },
    {
      nameTemplate: 'Replay attack on {asset}',
      descriptionTemplate: 'An attacker could capture and replay authentication tokens or messages to {asset}.',
      threatAgents: ['Network attacker', 'Man-in-the-middle'],
      attackVectors: ['Network sniffing', 'Traffic interception'],
      defaultDreadRating: { damage: 6, reproducibility: 7, exploitability: 6, affectedUsers: 5, discoverability: 6 },
    },
  ],
  [StrideCategory.TAMPERING]: [
    {
      nameTemplate: 'Tampering with {asset} data',
      descriptionTemplate: 'An attacker could modify data stored in or transmitted by {asset} without authorization.',
      threatAgents: ['External attacker', 'Malicious insider', 'Compromised application'],
      attackVectors: ['SQL injection', 'Man-in-the-middle', 'Direct database access'],
      defaultDreadRating: { damage: 8, reproducibility: 6, exploitability: 5, affectedUsers: 8, discoverability: 4 },
    },
    {
      nameTemplate: 'Code injection in {asset}',
      descriptionTemplate: 'An attacker could inject malicious code into {asset} to alter its behavior.',
      threatAgents: ['External attacker', 'Supply chain attacker'],
      attackVectors: ['Code injection', 'Malicious updates', 'Compromised dependencies'],
      defaultDreadRating: { damage: 9, reproducibility: 5, exploitability: 4, affectedUsers: 9, discoverability: 3 },
    },
  ],
  [StrideCategory.REPUDIATION]: [
    {
      nameTemplate: 'Repudiation of actions on {asset}',
      descriptionTemplate: 'A user or system could deny performing actions on {asset} due to insufficient logging.',
      threatAgents: ['Malicious user', 'Fraudulent actor', 'Compromised account'],
      attackVectors: ['Log manipulation', 'Timestamp forgery', 'Audit bypass'],
      defaultDreadRating: { damage: 5, reproducibility: 7, exploitability: 6, affectedUsers: 4, discoverability: 5 },
    },
    {
      nameTemplate: 'Log tampering for {asset}',
      descriptionTemplate: 'An attacker could modify or delete audit logs related to {asset} to hide malicious activity.',
      threatAgents: ['Attacker with system access', 'Malicious administrator'],
      attackVectors: ['Log file manipulation', 'Database modification'],
      defaultDreadRating: { damage: 6, reproducibility: 5, exploitability: 4, affectedUsers: 6, discoverability: 3 },
    },
  ],
  [StrideCategory.INFORMATION_DISCLOSURE]: [
    {
      nameTemplate: 'Unauthorized disclosure of {asset}',
      descriptionTemplate: 'Sensitive information from {asset} could be exposed to unauthorized parties.',
      threatAgents: ['External attacker', 'Malicious insider', 'Accidental exposure'],
      attackVectors: ['Data breach', 'Network sniffing', 'Misconfiguration'],
      defaultDreadRating: { damage: 8, reproducibility: 6, exploitability: 5, affectedUsers: 8, discoverability: 5 },
    },
    {
      nameTemplate: 'Information leakage via error messages from {asset}',
      descriptionTemplate: 'Error messages or logs from {asset} could reveal sensitive system information.',
      threatAgents: ['External attacker', 'Reconnaissance'],
      attackVectors: ['Error page analysis', 'Log analysis', 'Debug endpoints'],
      defaultDreadRating: { damage: 4, reproducibility: 8, exploitability: 8, affectedUsers: 5, discoverability: 7 },
    },
  ],
  [StrideCategory.DENIAL_OF_SERVICE]: [
    {
      nameTemplate: 'Denial of service against {asset}',
      descriptionTemplate: 'An attacker could disrupt the availability of {asset} through resource exhaustion.',
      threatAgents: ['External attacker', 'Botnet operator', 'Competitor'],
      attackVectors: ['DDoS', 'Resource exhaustion', 'Algorithmic complexity attacks'],
      defaultDreadRating: { damage: 7, reproducibility: 8, exploitability: 7, affectedUsers: 9, discoverability: 6 },
    },
    {
      nameTemplate: 'Resource exhaustion of {asset}',
      descriptionTemplate: 'An attacker could exhaust critical resources (CPU, memory, storage) of {asset}.',
      threatAgents: ['External attacker', 'Malicious user'],
      attackVectors: ['Excessive requests', 'Large file uploads', 'Memory leaks exploitation'],
      defaultDreadRating: { damage: 6, reproducibility: 7, exploitability: 6, affectedUsers: 7, discoverability: 5 },
    },
  ],
  [StrideCategory.ELEVATION_OF_PRIVILEGE]: [
    {
      nameTemplate: 'Privilege escalation on {asset}',
      descriptionTemplate: 'An attacker could gain elevated privileges on {asset} beyond their authorized level.',
      threatAgents: ['External attacker', 'Malicious user', 'Compromised account'],
      attackVectors: ['Vulnerability exploitation', 'Configuration error', 'IDOR'],
      defaultDreadRating: { damage: 9, reproducibility: 5, exploitability: 4, affectedUsers: 8, discoverability: 4 },
    },
    {
      nameTemplate: 'Bypass of access controls on {asset}',
      descriptionTemplate: 'An attacker could bypass authentication or authorization mechanisms protecting {asset}.',
      threatAgents: ['External attacker', 'Insider threat'],
      attackVectors: ['Authentication bypass', 'Session hijacking', 'Token manipulation'],
      defaultDreadRating: { damage: 8, reproducibility: 5, exploitability: 5, affectedUsers: 7, discoverability: 4 },
    },
  ],
};

/**
 * Generate a unique threat ID
 * @param existingIds Set of existing threat IDs
 * @param prefix ID prefix (default: 'ST')
 * @returns Unique threat ID
 */
const generateThreatId = (existingIds: Set<string>, prefix: string = 'ST'): string => {
  let counter = existingIds.size + 1;
  let id = `${prefix}_${String(counter).padStart(3, '0')}`;
  while (existingIds.has(id)) {
    counter++;
    id = `${prefix}_${String(counter).padStart(3, '0')}`;
  }
  return id;
};

/**
 * Generate STRIDE threats from an asset
 * @param asset The asset to analyze
 * @param existingThreatIds Set of existing threat IDs to avoid duplicates
 * @returns Array of generated STRIDE threats
 */
export const generateStrideThreatsFromAsset = (
  asset: Asset,
  existingThreatIds: Set<string>
): StrideThreat[] => {
  const threats: StrideThreat[] = [];
  const usedIds = new Set(existingThreatIds);

  // For each security property of the asset, generate relevant STRIDE threats
  asset.securityProperties.forEach(securityProperty => {
    const strideCategory = securityPropertyToStrideMapping[securityProperty];
    const templates = threatTemplates[strideCategory];

    templates.forEach(template => {
      const id = generateThreatId(usedIds);
      usedIds.add(id);

      const threat: StrideThreat = {
        id,
        name: template.nameTemplate.replace('{asset}', asset.name),
        description: template.descriptionTemplate.replace('{asset}', asset.name),
        strideCategory,
        assetId: asset.id,
        affectedComponent: asset.name,
        threatAgent: template.threatAgents[0],
        attackVector: template.attackVectors[0],
        dpiaDreadRating: { ...template.defaultDreadRating },
        mitigations: [],
        status: 'Identified',
        comment: `Auto-generated from asset "${asset.name}" based on ${securityProperty} security property.`,
      };

      threats.push(threat);
    });
  });

  return threats;
};

/**
 * Generate STRIDE threats for all assets in a project
 * @param assets Array of project assets
 * @param existingThreats Existing STRIDE threats (to avoid ID conflicts)
 * @returns Array of generated STRIDE threats
 */
export const generateStrideThreatsForProject = (
  assets: Asset[],
  existingThreats: StrideThreat[] = []
): StrideThreat[] => {
  const existingIds = new Set(existingThreats.map(t => t.id));
  const allThreats: StrideThreat[] = [];

  assets.forEach(asset => {
    const assetThreats = generateStrideThreatsFromAsset(asset, existingIds);
    assetThreats.forEach(threat => {
      existingIds.add(threat.id);
      allThreats.push(threat);
    });
  });

  return allThreats;
};

/**
 * Generate quick threats for a specific STRIDE category
 * @param category The STRIDE category
 * @param assetId The target asset ID
 * @param assetName The target asset name
 * @param existingIds Set of existing threat IDs
 * @returns Generated threat for the specified category
 */
export const generateQuickThreat = (
  category: StrideCategory,
  assetId: string,
  assetName: string,
  existingIds: Set<string>
): StrideThreat => {
  const templates = threatTemplates[category];
  const template = templates[0]; // Use first template
  const id = generateThreatId(existingIds);

  return {
    id,
    name: template.nameTemplate.replace('{asset}', assetName),
    description: template.descriptionTemplate.replace('{asset}', assetName),
    strideCategory: category,
    assetId,
    affectedComponent: assetName,
    threatAgent: template.threatAgents[0],
    attackVector: template.attackVectors[0],
    dpiaDreadRating: { ...template.defaultDreadRating },
    mitigations: [],
    status: 'Identified',
    comment: '',
  };
};

/**
 * Get all possible STRIDE categories for an asset based on its security properties
 * @param asset The asset to analyze
 * @returns Array of applicable STRIDE categories
 */
export const getApplicableStrideCategories = (asset: Asset): StrideCategory[] => {
  const categories = new Set<StrideCategory>();

  asset.securityProperties.forEach(prop => {
    categories.add(securityPropertyToStrideMapping[prop]);
  });

  return Array.from(categories);
};

/**
 * Validate that a STRIDE threat is complete
 * @param threat The threat to validate
 * @returns Object with validation result and any errors
 */
export const validateStrideThreat = (threat: StrideThreat): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!threat.id) errors.push('Threat ID is required');
  if (!threat.name) errors.push('Threat name is required');
  if (!threat.strideCategory) errors.push('STRIDE category is required');
  if (!threat.assetId) errors.push('Asset must be specified');

  // Validate DREAD ratings are within bounds
  const dreadFields: (keyof DreadRating)[] = ['damage', 'reproducibility', 'exploitability', 'affectedUsers', 'discoverability'];
  dreadFields.forEach(field => {
    const value = threat.dpiaDreadRating[field];
    if (value < 1 || value > 10) {
      errors.push(`DREAD ${field} must be between 1 and 10`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
