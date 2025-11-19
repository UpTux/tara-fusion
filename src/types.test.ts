import { describe, expect, it } from 'vitest';
import { getProjectViewsForMethodology, TaraMethodology } from './types';

describe('getProjectViewsForMethodology', () => {
    it('should return all views for Attack Feasibility methodology', () => {
        const views = getProjectViewsForMethodology(TaraMethodology.ATTACK_FEASIBILITY);
        
        // Should include attack tree views
        expect(views).toContain('Attack Trees');
        expect(views).toContain('Technical Attack Trees');
        expect(views).toContain('Circumvent Trees');
        expect(views).toContain('Attack Leaves');
        
        // Should also include common views
        expect(views).toContain('Project Cockpit');
        expect(views).toContain('Threats');
        expect(views).toContain('Assets');
    });

    it('should exclude attack tree views for STRIDE methodology', () => {
        const views = getProjectViewsForMethodology(TaraMethodology.STRIDE);
        
        // Should NOT include attack tree views
        expect(views).not.toContain('Attack Trees');
        expect(views).not.toContain('Technical Attack Trees');
        expect(views).not.toContain('Circumvent Trees');
        expect(views).not.toContain('Attack Leaves');
        
        // Should still include common views
        expect(views).toContain('Project Cockpit');
        expect(views).toContain('Threats');
        expect(views).toContain('Assets');
        expect(views).toContain('Damage Scenarios');
        expect(views).toContain('Security Controls');
    });

    it('should return all views for Likelihood methodology', () => {
        const views = getProjectViewsForMethodology(TaraMethodology.LIKELIHOOD);
        
        // Should include attack tree views (not filtered for Likelihood)
        expect(views).toContain('Attack Trees');
        expect(views).toContain('Technical Attack Trees');
        expect(views).toContain('Circumvent Trees');
        expect(views).toContain('Attack Leaves');
    });

    it('should preserve separators in filtered views', () => {
        const strideViews = getProjectViewsForMethodology(TaraMethodology.STRIDE);
        
        // Should still have separators
        expect(strideViews).toContain('---');
        
        // Count separators to ensure structure is preserved
        const separatorCount = strideViews.filter(view => view === '---').length;
        expect(separatorCount).toBeGreaterThan(0);
    });

    it('should return fewer views for STRIDE than Attack Feasibility', () => {
        const afViews = getProjectViewsForMethodology(TaraMethodology.ATTACK_FEASIBILITY);
        const strideViews = getProjectViewsForMethodology(TaraMethodology.STRIDE);
        
        // STRIDE should have 4 fewer views (the 4 attack tree views)
        expect(strideViews.length).toBe(afViews.length - 4);
    });
});
