import { describe, it, expect } from 'vitest';
import {
  calculateDreadScore,
  getDreadRiskLevel,
  getDreadScoreColor,
  getStrideCategoryColor,
  getStrideCategoryLetter,
  createDefaultDreadRating,
  createStrideThreat,
  calculateStrideStatistics,
  sortThreatsByRisk,
  filterThreatsByCategory,
  filterThreatsByMinScore,
  suggestMitigations,
} from './strideDreadService';
import { DreadRating, RiskLevel, StrideCategory, StrideThreat } from '../types';

describe('strideDreadService', () => {
  describe('calculateDreadScore', () => {
    it('should calculate the average of all DREAD factors', () => {
      const rating: DreadRating = {
        damage: 10,
        reproducibility: 8,
        exploitability: 6,
        affectedUsers: 4,
        discoverability: 2,
      };
      // (10 + 8 + 6 + 4 + 2) / 5 = 6
      expect(calculateDreadScore(rating)).toBe(6);
    });

    it('should return maximum score of 10 for all max values', () => {
      const rating: DreadRating = {
        damage: 10,
        reproducibility: 10,
        exploitability: 10,
        affectedUsers: 10,
        discoverability: 10,
      };
      expect(calculateDreadScore(rating)).toBe(10);
    });

    it('should return minimum score of 1 for all min values', () => {
      const rating: DreadRating = {
        damage: 1,
        reproducibility: 1,
        exploitability: 1,
        affectedUsers: 1,
        discoverability: 1,
      };
      expect(calculateDreadScore(rating)).toBe(1);
    });

    it('should round to one decimal place', () => {
      const rating: DreadRating = {
        damage: 7,
        reproducibility: 7,
        exploitability: 7,
        affectedUsers: 7,
        discoverability: 8, // Total 36, avg 7.2
      };
      expect(calculateDreadScore(rating)).toBe(7.2);
    });
  });

  describe('getDreadRiskLevel', () => {
    it('should return CRITICAL for scores >= 8', () => {
      expect(getDreadRiskLevel(8)).toBe(RiskLevel.CRITICAL);
      expect(getDreadRiskLevel(10)).toBe(RiskLevel.CRITICAL);
    });

    it('should return HIGH for scores >= 6 and < 8', () => {
      expect(getDreadRiskLevel(6)).toBe(RiskLevel.HIGH);
      expect(getDreadRiskLevel(7.9)).toBe(RiskLevel.HIGH);
    });

    it('should return MEDIUM for scores >= 4 and < 6', () => {
      expect(getDreadRiskLevel(4)).toBe(RiskLevel.MEDIUM);
      expect(getDreadRiskLevel(5.9)).toBe(RiskLevel.MEDIUM);
    });

    it('should return LOW for scores >= 2 and < 4', () => {
      expect(getDreadRiskLevel(2)).toBe(RiskLevel.LOW);
      expect(getDreadRiskLevel(3.9)).toBe(RiskLevel.LOW);
    });

    it('should return NEGLIGIBLE for scores < 2', () => {
      expect(getDreadRiskLevel(1)).toBe(RiskLevel.NEGLIGIBLE);
      expect(getDreadRiskLevel(1.9)).toBe(RiskLevel.NEGLIGIBLE);
    });
  });

  describe('getDreadScoreColor', () => {
    it('should return red for critical scores', () => {
      expect(getDreadScoreColor(8)).toContain('red');
      expect(getDreadScoreColor(10)).toContain('red');
    });

    it('should return orange for high scores', () => {
      expect(getDreadScoreColor(6)).toContain('orange');
    });

    it('should return yellow for medium scores', () => {
      expect(getDreadScoreColor(4)).toContain('yellow');
    });

    it('should return green for low scores', () => {
      expect(getDreadScoreColor(2)).toContain('green');
    });

    it('should return gray for negligible scores', () => {
      expect(getDreadScoreColor(1)).toContain('gray');
    });
  });

  describe('getStrideCategoryLetter', () => {
    it('should return correct letter for each STRIDE category', () => {
      expect(getStrideCategoryLetter(StrideCategory.SPOOFING)).toBe('S');
      expect(getStrideCategoryLetter(StrideCategory.TAMPERING)).toBe('T');
      expect(getStrideCategoryLetter(StrideCategory.REPUDIATION)).toBe('R');
      expect(getStrideCategoryLetter(StrideCategory.INFORMATION_DISCLOSURE)).toBe('I');
      expect(getStrideCategoryLetter(StrideCategory.DENIAL_OF_SERVICE)).toBe('D');
      expect(getStrideCategoryLetter(StrideCategory.ELEVATION_OF_PRIVILEGE)).toBe('E');
    });
  });

  describe('getStrideCategoryColor', () => {
    it('should return a color string for each category', () => {
      Object.values(StrideCategory).forEach(category => {
        const color = getStrideCategoryColor(category);
        expect(color).toBeTruthy();
        expect(typeof color).toBe('string');
      });
    });
  });

  describe('createDefaultDreadRating', () => {
    it('should create a rating with all factors set to 5', () => {
      const rating = createDefaultDreadRating();
      expect(rating.damage).toBe(5);
      expect(rating.reproducibility).toBe(5);
      expect(rating.exploitability).toBe(5);
      expect(rating.affectedUsers).toBe(5);
      expect(rating.discoverability).toBe(5);
    });
  });

  describe('createStrideThreat', () => {
    it('should create a new STRIDE threat with default values', () => {
      const threat = createStrideThreat('ST_001', 'Test Threat', StrideCategory.SPOOFING, 'ASSET_001');

      expect(threat.id).toBe('ST_001');
      expect(threat.name).toBe('Test Threat');
      expect(threat.strideCategory).toBe(StrideCategory.SPOOFING);
      expect(threat.assetId).toBe('ASSET_001');
      expect(threat.status).toBe('Identified');
      expect(threat.mitigations).toEqual([]);
      expect(calculateDreadScore(threat.dpiaDreadRating)).toBe(5);
    });
  });

  describe('calculateStrideStatistics', () => {
    const mockThreats: StrideThreat[] = [
      createStrideThreat('ST_001', 'Threat 1', StrideCategory.SPOOFING, 'A1'),
      createStrideThreat('ST_002', 'Threat 2', StrideCategory.TAMPERING, 'A1'),
      createStrideThreat('ST_003', 'Threat 3', StrideCategory.SPOOFING, 'A2'),
    ];

    it('should calculate total threat count', () => {
      const stats = calculateStrideStatistics(mockThreats);
      expect(stats.total).toBe(3);
    });

    it('should count threats by category', () => {
      const stats = calculateStrideStatistics(mockThreats);
      expect(stats.byCategory[StrideCategory.SPOOFING]).toBe(2);
      expect(stats.byCategory[StrideCategory.TAMPERING]).toBe(1);
      expect(stats.byCategory[StrideCategory.REPUDIATION]).toBe(0);
    });

    it('should count threats by status', () => {
      const stats = calculateStrideStatistics(mockThreats);
      expect(stats.byStatus['Identified']).toBe(3);
    });

    it('should calculate average DREAD score', () => {
      const stats = calculateStrideStatistics(mockThreats);
      expect(stats.averageDreadScore).toBe(5); // All default ratings = 5
    });

    it('should return zero counts for empty array', () => {
      const stats = calculateStrideStatistics([]);
      expect(stats.total).toBe(0);
      expect(stats.averageDreadScore).toBe(0);
    });
  });

  describe('sortThreatsByRisk', () => {
    it('should sort threats by DREAD score descending', () => {
      const threats: StrideThreat[] = [
        {
          ...createStrideThreat('ST_001', 'Low Risk', StrideCategory.SPOOFING, 'A1'),
          dpiaDreadRating: { damage: 2, reproducibility: 2, exploitability: 2, affectedUsers: 2, discoverability: 2 },
        },
        {
          ...createStrideThreat('ST_002', 'High Risk', StrideCategory.TAMPERING, 'A1'),
          dpiaDreadRating: { damage: 9, reproducibility: 9, exploitability: 9, affectedUsers: 9, discoverability: 9 },
        },
        {
          ...createStrideThreat('ST_003', 'Medium Risk', StrideCategory.REPUDIATION, 'A1'),
          dpiaDreadRating: { damage: 5, reproducibility: 5, exploitability: 5, affectedUsers: 5, discoverability: 5 },
        },
      ];

      const sorted = sortThreatsByRisk(threats);
      expect(sorted[0].name).toBe('High Risk');
      expect(sorted[1].name).toBe('Medium Risk');
      expect(sorted[2].name).toBe('Low Risk');
    });

    it('should not mutate the original array', () => {
      const threats = [createStrideThreat('ST_001', 'Test', StrideCategory.SPOOFING, 'A1')];
      const sorted = sortThreatsByRisk(threats);
      expect(sorted).not.toBe(threats);
    });
  });

  describe('filterThreatsByCategory', () => {
    const threats: StrideThreat[] = [
      createStrideThreat('ST_001', 'Spoofing 1', StrideCategory.SPOOFING, 'A1'),
      createStrideThreat('ST_002', 'Tampering 1', StrideCategory.TAMPERING, 'A1'),
      createStrideThreat('ST_003', 'Spoofing 2', StrideCategory.SPOOFING, 'A2'),
    ];

    it('should filter threats by single category', () => {
      const filtered = filterThreatsByCategory(threats, [StrideCategory.SPOOFING]);
      expect(filtered.length).toBe(2);
      expect(filtered.every(t => t.strideCategory === StrideCategory.SPOOFING)).toBe(true);
    });

    it('should filter threats by multiple categories', () => {
      const filtered = filterThreatsByCategory(threats, [StrideCategory.SPOOFING, StrideCategory.TAMPERING]);
      expect(filtered.length).toBe(3);
    });

    it('should return all threats when categories array is empty', () => {
      const filtered = filterThreatsByCategory(threats, []);
      expect(filtered.length).toBe(3);
    });
  });

  describe('filterThreatsByMinScore', () => {
    it('should filter threats by minimum DREAD score', () => {
      const threats: StrideThreat[] = [
        {
          ...createStrideThreat('ST_001', 'Low', StrideCategory.SPOOFING, 'A1'),
          dpiaDreadRating: { damage: 2, reproducibility: 2, exploitability: 2, affectedUsers: 2, discoverability: 2 },
        },
        {
          ...createStrideThreat('ST_002', 'High', StrideCategory.TAMPERING, 'A1'),
          dpiaDreadRating: { damage: 8, reproducibility: 8, exploitability: 8, affectedUsers: 8, discoverability: 8 },
        },
      ];

      const filtered = filterThreatsByMinScore(threats, 5);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('High');
    });
  });

  describe('suggestMitigations', () => {
    it('should return mitigation suggestions for each STRIDE category', () => {
      Object.values(StrideCategory).forEach(category => {
        const suggestions = suggestMitigations(category);
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should return authentication-related mitigations for SPOOFING', () => {
      const suggestions = suggestMitigations(StrideCategory.SPOOFING);
      expect(suggestions.some(s => s.toLowerCase().includes('authentication'))).toBe(true);
    });

    it('should return integrity-related mitigations for TAMPERING', () => {
      const suggestions = suggestMitigations(StrideCategory.TAMPERING);
      expect(suggestions.some(s => s.toLowerCase().includes('integrity') || s.toLowerCase().includes('signature'))).toBe(true);
    });

    it('should return logging-related mitigations for REPUDIATION', () => {
      const suggestions = suggestMitigations(StrideCategory.REPUDIATION);
      expect(suggestions.some(s => s.toLowerCase().includes('log') || s.toLowerCase().includes('audit'))).toBe(true);
    });

    it('should return encryption-related mitigations for INFORMATION_DISCLOSURE', () => {
      const suggestions = suggestMitigations(StrideCategory.INFORMATION_DISCLOSURE);
      expect(suggestions.some(s => s.toLowerCase().includes('encrypt'))).toBe(true);
    });

    it('should return rate limiting mitigations for DENIAL_OF_SERVICE', () => {
      const suggestions = suggestMitigations(StrideCategory.DENIAL_OF_SERVICE);
      expect(suggestions.some(s => s.toLowerCase().includes('rate') || s.toLowerCase().includes('limit'))).toBe(true);
    });

    it('should return privilege-related mitigations for ELEVATION_OF_PRIVILEGE', () => {
      const suggestions = suggestMitigations(StrideCategory.ELEVATION_OF_PRIVILEGE);
      expect(suggestions.some(s => s.toLowerCase().includes('privilege') || s.toLowerCase().includes('authorization'))).toBe(true);
    });
  });
});
