import { describe, it, expect } from 'vitest';
import {
  securityPropertyToStrideMapping,
  generateStrideThreatsFromAsset,
  generateStrideThreatsForProject,
  generateQuickThreat,
  getApplicableStrideCategories,
  validateStrideThreat,
} from './strideThreatGenerator';
import { createStrideThreat } from './strideDreadService';
import { Asset, SecurityProperty, StrideCategory } from '../types';

describe('strideThreatGenerator', () => {
  describe('securityPropertyToStrideMapping', () => {
    it('should map AUTHENTICITY to SPOOFING', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.AUTHENTICITY]).toBe(StrideCategory.SPOOFING);
    });

    it('should map INTEGRITY to TAMPERING', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.INTEGRITY]).toBe(StrideCategory.TAMPERING);
    });

    it('should map NON_REPUDIATION to REPUDIATION', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.NON_REPUDIATION]).toBe(StrideCategory.REPUDIATION);
    });

    it('should map CONFIDENTIALITY to INFORMATION_DISCLOSURE', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.CONFIDENTIALITY]).toBe(StrideCategory.INFORMATION_DISCLOSURE);
    });

    it('should map AVAILABILITY to DENIAL_OF_SERVICE', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.AVAILABILITY]).toBe(StrideCategory.DENIAL_OF_SERVICE);
    });

    it('should map AUTHORIZATION to ELEVATION_OF_PRIVILEGE', () => {
      expect(securityPropertyToStrideMapping[SecurityProperty.AUTHORIZATION]).toBe(StrideCategory.ELEVATION_OF_PRIVILEGE);
    });

    it('should have a mapping for all security properties', () => {
      Object.values(SecurityProperty).forEach(prop => {
        expect(securityPropertyToStrideMapping[prop]).toBeDefined();
      });
    });
  });

  describe('generateStrideThreatsFromAsset', () => {
    const mockAsset: Asset = {
      id: 'ASSET_001',
      name: 'User Database',
      description: 'Database storing user information',
      securityProperties: [SecurityProperty.CONFIDENTIALITY, SecurityProperty.INTEGRITY],
      toeConfigurationIds: [],
      comment: '',
    };

    it('should generate threats for each security property', () => {
      const threats = generateStrideThreatsFromAsset(mockAsset, new Set());

      // CONFIDENTIALITY maps to INFORMATION_DISCLOSURE (2 templates)
      // INTEGRITY maps to TAMPERING (2 templates)
      // Total: 4 threats
      expect(threats.length).toBe(4);
    });

    it('should generate unique IDs for each threat', () => {
      const threats = generateStrideThreatsFromAsset(mockAsset, new Set());
      const ids = threats.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should avoid existing IDs', () => {
      const existingIds = new Set(['ST_001', 'ST_002', 'ST_003']);
      const threats = generateStrideThreatsFromAsset(mockAsset, existingIds);

      threats.forEach(threat => {
        expect(existingIds.has(threat.id)).toBe(false);
      });
    });

    it('should include asset name in threat name', () => {
      const threats = generateStrideThreatsFromAsset(mockAsset, new Set());

      threats.forEach(threat => {
        expect(threat.name.includes('User Database')).toBe(true);
      });
    });

    it('should set the correct asset ID', () => {
      const threats = generateStrideThreatsFromAsset(mockAsset, new Set());

      threats.forEach(threat => {
        expect(threat.assetId).toBe('ASSET_001');
      });
    });

    it('should map to correct STRIDE categories', () => {
      const threats = generateStrideThreatsFromAsset(mockAsset, new Set());

      const categories = threats.map(t => t.strideCategory);
      expect(categories).toContain(StrideCategory.INFORMATION_DISCLOSURE);
      expect(categories).toContain(StrideCategory.TAMPERING);
    });
  });

  describe('generateStrideThreatsForProject', () => {
    const mockAssets: Asset[] = [
      {
        id: 'ASSET_001',
        name: 'Database',
        description: '',
        securityProperties: [SecurityProperty.CONFIDENTIALITY],
        toeConfigurationIds: [],
        comment: '',
      },
      {
        id: 'ASSET_002',
        name: 'API Gateway',
        description: '',
        securityProperties: [SecurityProperty.AVAILABILITY],
        toeConfigurationIds: [],
        comment: '',
      },
    ];

    it('should generate threats for all assets', () => {
      const threats = generateStrideThreatsForProject(mockAssets);

      expect(threats.length).toBeGreaterThan(0);

      // Should have threats for both assets
      const assetIds = new Set(threats.map(t => t.assetId));
      expect(assetIds.has('ASSET_001')).toBe(true);
      expect(assetIds.has('ASSET_002')).toBe(true);
    });

    it('should generate unique IDs across all assets', () => {
      const threats = generateStrideThreatsForProject(mockAssets);
      const ids = threats.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should avoid conflicts with existing threats', () => {
      const existingThreats = [
        createStrideThreat('ST_001', 'Existing', StrideCategory.SPOOFING, 'X'),
      ];

      const threats = generateStrideThreatsForProject(mockAssets, existingThreats);

      threats.forEach(threat => {
        expect(threat.id).not.toBe('ST_001');
      });
    });

    it('should return empty array for empty assets', () => {
      const threats = generateStrideThreatsForProject([]);
      expect(threats).toEqual([]);
    });
  });

  describe('generateQuickThreat', () => {
    it('should generate a threat for the specified category', () => {
      const threat = generateQuickThreat(
        StrideCategory.SPOOFING,
        'ASSET_001',
        'Test Asset',
        new Set()
      );

      expect(threat.strideCategory).toBe(StrideCategory.SPOOFING);
      expect(threat.assetId).toBe('ASSET_001');
      expect(threat.name).toContain('Test Asset');
    });

    it('should avoid existing IDs', () => {
      const existingIds = new Set(['ST_001']);
      const threat = generateQuickThreat(
        StrideCategory.TAMPERING,
        'ASSET_001',
        'Test Asset',
        existingIds
      );

      expect(threat.id).not.toBe('ST_001');
    });

    it('should set status to Identified', () => {
      const threat = generateQuickThreat(
        StrideCategory.DENIAL_OF_SERVICE,
        'ASSET_001',
        'Test Asset',
        new Set()
      );

      expect(threat.status).toBe('Identified');
    });
  });

  describe('getApplicableStrideCategories', () => {
    it('should return unique categories based on security properties', () => {
      const asset: Asset = {
        id: 'A1',
        name: 'Test',
        description: '',
        securityProperties: [
          SecurityProperty.CONFIDENTIALITY,
          SecurityProperty.INTEGRITY,
          SecurityProperty.AVAILABILITY,
        ],
        toeConfigurationIds: [],
        comment: '',
      };

      const categories = getApplicableStrideCategories(asset);

      expect(categories).toContain(StrideCategory.INFORMATION_DISCLOSURE);
      expect(categories).toContain(StrideCategory.TAMPERING);
      expect(categories).toContain(StrideCategory.DENIAL_OF_SERVICE);
      expect(categories.length).toBe(3);
    });

    it('should handle assets with no security properties', () => {
      const asset: Asset = {
        id: 'A1',
        name: 'Test',
        description: '',
        securityProperties: [],
        toeConfigurationIds: [],
        comment: '',
      };

      const categories = getApplicableStrideCategories(asset);
      expect(categories.length).toBe(0);
    });

    it('should deduplicate categories when properties map to same category', () => {
      const asset: Asset = {
        id: 'A1',
        name: 'Test',
        description: '',
        securityProperties: [
          SecurityProperty.INTEGRITY,
          SecurityProperty.CORRECTNESS, // Both map to TAMPERING
        ],
        toeConfigurationIds: [],
        comment: '',
      };

      const categories = getApplicableStrideCategories(asset);
      expect(categories.length).toBe(1);
      expect(categories[0]).toBe(StrideCategory.TAMPERING);
    });
  });

  describe('validateStrideThreat', () => {
    it('should validate a complete threat', () => {
      const threat = createStrideThreat('ST_001', 'Test Threat', StrideCategory.SPOOFING, 'ASSET_001');
      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should catch missing ID', () => {
      const threat = createStrideThreat('', 'Test Threat', StrideCategory.SPOOFING, 'ASSET_001');
      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ID'))).toBe(true);
    });

    it('should catch missing name', () => {
      const threat = createStrideThreat('ST_001', '', StrideCategory.SPOOFING, 'ASSET_001');
      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should catch missing asset', () => {
      const threat = createStrideThreat('ST_001', 'Test', StrideCategory.SPOOFING, '');
      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Asset'))).toBe(true);
    });

    it('should catch DREAD ratings out of bounds', () => {
      const threat = createStrideThreat('ST_001', 'Test', StrideCategory.SPOOFING, 'ASSET_001');
      threat.dpiaDreadRating.damage = 15; // Invalid: > 10

      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('damage'))).toBe(true);
    });

    it('should catch DREAD ratings below minimum', () => {
      const threat = createStrideThreat('ST_001', 'Test', StrideCategory.SPOOFING, 'ASSET_001');
      threat.dpiaDreadRating.exploitability = 0; // Invalid: < 1

      const result = validateStrideThreat(threat);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exploitability'))).toBe(true);
    });
  });
});
