import { DreadRating, RiskLevel, StrideCategory, StrideThreat, SecurityProperty } from '../types';

/**
 * STRIDE DREAD Service
 *
 * Implements the STRIDE threat modeling methodology (Microsoft) combined with
 * DREAD risk rating system for threat assessment.
 *
 * STRIDE Categories:
 * - Spoofing: Pretending to be something or someone you're not
 * - Tampering: Modifying data or code without authorization
 * - Repudiation: Denying having performed an action
 * - Information Disclosure: Exposing information to unauthorized parties
 * - Denial of Service: Denying or degrading service to users
 * - Elevation of Privilege: Gaining capabilities without proper authorization
 *
 * DREAD Rating Factors (each 1-10):
 * - Damage potential: How much damage could the attack cause?
 * - Reproducibility: How easy is it to reproduce the attack?
 * - Exploitability: How easy is it to launch the attack?
 * - Affected users: How many users are affected?
 * - Discoverability: How easy is it to discover the vulnerability?
 */

// STRIDE category descriptions for UI
export const strideCategoryDescriptions: Record<StrideCategory, { description: string; examples: string[]; securityProperty: SecurityProperty }> = {
  [StrideCategory.SPOOFING]: {
    description: 'Pretending to be something or someone other than yourself',
    examples: [
      'Forging email headers',
      'Replaying authentication credentials',
      'IP address spoofing',
      'DNS spoofing',
    ],
    securityProperty: SecurityProperty.AUTHENTICITY,
  },
  [StrideCategory.TAMPERING]: {
    description: 'Modifying data or code without authorization',
    examples: [
      'Modifying data in transit',
      'Changing database records',
      'Altering configuration files',
      'Man-in-the-middle attacks',
    ],
    securityProperty: SecurityProperty.INTEGRITY,
  },
  [StrideCategory.REPUDIATION]: {
    description: 'Denying having performed an action',
    examples: [
      'Claiming not to have made a purchase',
      'Denying sending a message',
      'Removing audit logs',
      'Claiming account was compromised',
    ],
    securityProperty: SecurityProperty.NON_REPUDIATION,
  },
  [StrideCategory.INFORMATION_DISCLOSURE]: {
    description: 'Exposing information to unauthorized parties',
    examples: [
      'Data breaches',
      'Unauthorized file access',
      'Network sniffing',
      'Error messages revealing system info',
    ],
    securityProperty: SecurityProperty.CONFIDENTIALITY,
  },
  [StrideCategory.DENIAL_OF_SERVICE]: {
    description: 'Denying or degrading service to users',
    examples: [
      'DDoS attacks',
      'Resource exhaustion',
      'Crashing services',
      'Filling up disk space',
    ],
    securityProperty: SecurityProperty.AVAILABILITY,
  },
  [StrideCategory.ELEVATION_OF_PRIVILEGE]: {
    description: 'Gaining capabilities without proper authorization',
    examples: [
      'Exploiting buffer overflows',
      'SQL injection for admin access',
      'Privilege escalation vulnerabilities',
      'Bypassing access controls',
    ],
    securityProperty: SecurityProperty.AUTHORIZATION,
  },
};

// DREAD factor descriptions for UI
export const dreadFactorDescriptions: Record<keyof DreadRating, { name: string; description: string; lowExample: string; highExample: string }> = {
  damage: {
    name: 'Damage Potential',
    description: 'How much damage could the attack cause?',
    lowExample: '1-3: Minor inconvenience, easily recoverable',
    highExample: '8-10: Complete system compromise, data loss, financial damage',
  },
  reproducibility: {
    name: 'Reproducibility',
    description: 'How easy is it to reproduce the attack?',
    lowExample: '1-3: Difficult to reproduce, requires specific conditions',
    highExample: '8-10: Always reproducible, can be automated',
  },
  exploitability: {
    name: 'Exploitability',
    description: 'How easy is it to launch the attack?',
    lowExample: '1-3: Requires advanced skills and tools',
    highExample: '8-10: Script kiddie can do it, tools widely available',
  },
  affectedUsers: {
    name: 'Affected Users',
    description: 'How many users are affected?',
    lowExample: '1-3: Single user or small group',
    highExample: '8-10: All users, critical systems affected',
  },
  discoverability: {
    name: 'Discoverability',
    description: 'How easy is it to discover the vulnerability?',
    lowExample: '1-3: Hard to find, requires insider knowledge',
    highExample: '8-10: Publicly known, easily discoverable',
  },
};

/**
 * Calculate DREAD score from individual ratings
 * @param rating The DREAD rating object
 * @returns Average DREAD score (1-10)
 */
export const calculateDreadScore = (rating: DreadRating): number => {
  const { damage, reproducibility, exploitability, affectedUsers, discoverability } = rating;
  const total = damage + reproducibility + exploitability + affectedUsers + discoverability;
  return Math.round((total / 5) * 10) / 10; // Round to 1 decimal place
};

/**
 * Map DREAD score to Risk Level
 * @param dreadScore The calculated DREAD score (1-10)
 * @returns Corresponding Risk Level
 */
export const getDreadRiskLevel = (dreadScore: number): RiskLevel => {
  if (dreadScore >= 8) return RiskLevel.CRITICAL;
  if (dreadScore >= 6) return RiskLevel.HIGH;
  if (dreadScore >= 4) return RiskLevel.MEDIUM;
  if (dreadScore >= 2) return RiskLevel.LOW;
  return RiskLevel.NEGLIGIBLE;
};

/**
 * Get risk level thresholds for DREAD
 */
export const dreadRiskThresholds = {
  [RiskLevel.CRITICAL]: { min: 8, max: 10, label: 'Critical (8-10)' },
  [RiskLevel.HIGH]: { min: 6, max: 7.9, label: 'High (6-7.9)' },
  [RiskLevel.MEDIUM]: { min: 4, max: 5.9, label: 'Medium (4-5.9)' },
  [RiskLevel.LOW]: { min: 2, max: 3.9, label: 'Low (2-3.9)' },
  [RiskLevel.NEGLIGIBLE]: { min: 0, max: 1.9, label: 'Negligible (0-1.9)' },
};

/**
 * Get color class for DREAD score
 * @param dreadScore The DREAD score (1-10)
 * @returns Tailwind CSS color class
 */
export const getDreadScoreColor = (dreadScore: number): string => {
  if (dreadScore >= 8) return 'bg-red-700 text-white';
  if (dreadScore >= 6) return 'bg-orange-600 text-white';
  if (dreadScore >= 4) return 'bg-yellow-500 text-black';
  if (dreadScore >= 2) return 'bg-green-600 text-white';
  return 'bg-gray-600 text-white';
};

/**
 * Get color class for individual DREAD factor
 * @param value The factor value (1-10)
 * @returns Tailwind CSS color class
 */
export const getDreadFactorColor = (value: number): string => {
  if (value >= 8) return 'text-red-400';
  if (value >= 6) return 'text-orange-400';
  if (value >= 4) return 'text-yellow-400';
  if (value >= 2) return 'text-green-400';
  return 'text-gray-400';
};

/**
 * Get STRIDE category color
 * @param category The STRIDE category
 * @returns Tailwind CSS color class
 */
export const getStrideCategoryColor = (category: StrideCategory): string => {
  switch (category) {
    case StrideCategory.SPOOFING:
      return 'bg-purple-600/30 text-purple-300 border-purple-500';
    case StrideCategory.TAMPERING:
      return 'bg-red-600/30 text-red-300 border-red-500';
    case StrideCategory.REPUDIATION:
      return 'bg-yellow-600/30 text-yellow-300 border-yellow-500';
    case StrideCategory.INFORMATION_DISCLOSURE:
      return 'bg-blue-600/30 text-blue-300 border-blue-500';
    case StrideCategory.DENIAL_OF_SERVICE:
      return 'bg-orange-600/30 text-orange-300 border-orange-500';
    case StrideCategory.ELEVATION_OF_PRIVILEGE:
      return 'bg-pink-600/30 text-pink-300 border-pink-500';
    default:
      return 'bg-gray-600/30 text-gray-300 border-gray-500';
  }
};

/**
 * Get STRIDE category icon/letter
 * @param category The STRIDE category
 * @returns Single letter representing the category
 */
export const getStrideCategoryLetter = (category: StrideCategory): string => {
  switch (category) {
    case StrideCategory.SPOOFING: return 'S';
    case StrideCategory.TAMPERING: return 'T';
    case StrideCategory.REPUDIATION: return 'R';
    case StrideCategory.INFORMATION_DISCLOSURE: return 'I';
    case StrideCategory.DENIAL_OF_SERVICE: return 'D';
    case StrideCategory.ELEVATION_OF_PRIVILEGE: return 'E';
    default: return '?';
  }
};

/**
 * Create a default DREAD rating
 * @returns Default DREAD rating with all factors set to 5 (medium)
 */
export const createDefaultDreadRating = (): DreadRating => ({
  damage: 5,
  reproducibility: 5,
  exploitability: 5,
  affectedUsers: 5,
  discoverability: 5,
});

/**
 * Create a new STRIDE threat
 * @param id Unique identifier
 * @param name Threat name
 * @param category STRIDE category
 * @param assetId Associated asset ID
 * @returns New StrideThreat object
 */
export const createStrideThreat = (
  id: string,
  name: string,
  category: StrideCategory,
  assetId: string
): StrideThreat => ({
  id,
  name,
  description: '',
  strideCategory: category,
  assetId,
  affectedComponent: '',
  threatAgent: '',
  attackVector: '',
  dpiaDreadRating: createDefaultDreadRating(),
  mitigations: [],
  status: 'Identified',
  comment: '',
});

/**
 * Calculate statistics for STRIDE threats
 * @param threats Array of STRIDE threats
 * @returns Statistics object
 */
export const calculateStrideStatistics = (threats: StrideThreat[]) => {
  const byCategory: Record<StrideCategory, number> = {
    [StrideCategory.SPOOFING]: 0,
    [StrideCategory.TAMPERING]: 0,
    [StrideCategory.REPUDIATION]: 0,
    [StrideCategory.INFORMATION_DISCLOSURE]: 0,
    [StrideCategory.DENIAL_OF_SERVICE]: 0,
    [StrideCategory.ELEVATION_OF_PRIVILEGE]: 0,
  };

  const byRiskLevel: Record<RiskLevel, number> = {
    [RiskLevel.CRITICAL]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.MEDIUM]: 0,
    [RiskLevel.LOW]: 0,
    [RiskLevel.NEGLIGIBLE]: 0,
  };

  const byStatus: Record<string, number> = {
    'Identified': 0,
    'In Analysis': 0,
    'Mitigated': 0,
    'Accepted': 0,
    'Transferred': 0,
  };

  let totalDreadScore = 0;

  threats.forEach(threat => {
    byCategory[threat.strideCategory]++;
    byStatus[threat.status]++;

    const dreadScore = calculateDreadScore(threat.dpiaDreadRating);
    totalDreadScore += dreadScore;

    const riskLevel = getDreadRiskLevel(dreadScore);
    byRiskLevel[riskLevel]++;
  });

  return {
    total: threats.length,
    byCategory,
    byRiskLevel,
    byStatus,
    averageDreadScore: threats.length > 0 ? Math.round((totalDreadScore / threats.length) * 10) / 10 : 0,
  };
};

/**
 * Sort threats by DREAD score (highest risk first)
 * @param threats Array of STRIDE threats
 * @returns Sorted array (highest risk first)
 */
export const sortThreatsByRisk = (threats: StrideThreat[]): StrideThreat[] => {
  return [...threats].sort((a, b) => {
    const scoreA = calculateDreadScore(a.dpiaDreadRating);
    const scoreB = calculateDreadScore(b.dpiaDreadRating);
    return scoreB - scoreA; // Descending order
  });
};

/**
 * Filter threats by STRIDE category
 * @param threats Array of STRIDE threats
 * @param categories Categories to filter by
 * @returns Filtered array
 */
export const filterThreatsByCategory = (
  threats: StrideThreat[],
  categories: StrideCategory[]
): StrideThreat[] => {
  if (categories.length === 0) return threats;
  return threats.filter(t => categories.includes(t.strideCategory));
};

/**
 * Filter threats by minimum DREAD score
 * @param threats Array of STRIDE threats
 * @param minScore Minimum DREAD score
 * @returns Filtered array
 */
export const filterThreatsByMinScore = (
  threats: StrideThreat[],
  minScore: number
): StrideThreat[] => {
  return threats.filter(t => calculateDreadScore(t.dpiaDreadRating) >= minScore);
};

/**
 * Suggest mitigations based on STRIDE category
 * @param category The STRIDE category
 * @returns Array of suggested mitigation strategies
 */
export const suggestMitigations = (category: StrideCategory): string[] => {
  switch (category) {
    case StrideCategory.SPOOFING:
      return [
        'Implement strong authentication mechanisms',
        'Use multi-factor authentication (MFA)',
        'Validate input and check digital signatures',
        'Use certificate-based authentication',
        'Implement secure session management',
      ];
    case StrideCategory.TAMPERING:
      return [
        'Use digital signatures and checksums',
        'Implement integrity validation',
        'Use secure communication channels (TLS)',
        'Implement access controls on data',
        'Use write-once audit logs',
      ];
    case StrideCategory.REPUDIATION:
      return [
        'Implement comprehensive audit logging',
        'Use digital signatures for transactions',
        'Implement non-repudiation mechanisms',
        'Secure and tamper-proof log storage',
        'Time-stamping of all actions',
      ];
    case StrideCategory.INFORMATION_DISCLOSURE:
      return [
        'Encrypt sensitive data at rest and in transit',
        'Implement proper access controls',
        'Use data masking and tokenization',
        'Minimize error message details',
        'Implement data classification and handling policies',
      ];
    case StrideCategory.DENIAL_OF_SERVICE:
      return [
        'Implement rate limiting',
        'Use load balancing and redundancy',
        'Implement resource quotas',
        'Use DDoS protection services',
        'Design for graceful degradation',
      ];
    case StrideCategory.ELEVATION_OF_PRIVILEGE:
      return [
        'Apply principle of least privilege',
        'Implement proper authorization checks',
        'Use sandboxing and isolation',
        'Regular security patching',
        'Input validation and sanitization',
      ];
    default:
      return [];
  }
};
