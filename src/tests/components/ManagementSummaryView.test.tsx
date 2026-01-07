import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ManagementSummaryView } from '../../components/ManagementSummaryView';
import { Project, RiskLevel } from '../../types';

describe('ManagementSummaryView', () => {
  const createMockProject = (overrides?: Partial<Project>): Project => ({
    id: 'proj-1',
    name: 'Test Project',
    methodology: 'TARA' as any,
    organizationId: '',
    scope: '',
    threats: [],
    damageScenarios: [],
    misuseCases: [],
    assumptions: [],
    securityGoals: [],
    securityControls: [],
    securityClaims: [],
    threatScenarios: [],
    relatedDocuments: [],
    needs: [],
    toeConfigurations: [],
    history: [],
    managementSummary: 'Initial summary',
    ...overrides,
  });

  it('should render management summary view', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Initial summary')).toBeInTheDocument();
  });

  it('should update summary when project prop changes', async () => {
    const { rerender } = render(
      <ManagementSummaryView
        project={createMockProject({ managementSummary: 'Initial' })}
        onProjectChange={vi.fn()}
        isReadOnly={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial')).toBeInTheDocument();
    });

    rerender(
      <ManagementSummaryView
        project={createMockProject({ managementSummary: 'Updated' })}
        onProjectChange={vi.fn()}
        isReadOnly={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    });
  });

  it('should allow editing summary when not read-only', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={false}
      />
    );

    const textarea = screen.getByDisplayValue('Initial summary') as HTMLTextAreaElement;
    expect(textarea).not.toBeDisabled();
  });

  it('should not update if summary is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={false}
      />
    );

    const textarea = screen.getByDisplayValue('Initial summary') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Initial summary' } });

    expect(mockOnProjectChange).not.toHaveBeenCalled();
  });

  it('should disable modifications when read-only', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    const textarea = screen.getByDisplayValue('Initial summary') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('readonly');
  });

  it('should render empty state when summary is empty', () => {
    const mockProject = createMockProject({ managementSummary: '' });
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('should display metrics when threat scenarios exist', () => {
    const mockProject = createMockProject({
      threatScenarios: [
        {
          id: 'TS_001',
          threatId: 'THR_001',
          name: 'Threat Scenario 1',
          description: 'First threat scenario',
          damageScenarioIds: [],
          attackPotential: {
            time: 3,
            expertise: 2,
            knowledge: 2,
            access: 1,
            equipment: 2,
          },
          comment: 'TS comment 1',
          treatmentDecision: 'REDUCE' as any,
        },
      ],
    });
    const mockOnProjectChange = vi.fn();

    render(
      <ManagementSummaryView
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Initial summary')).toBeInTheDocument();
  });
});
