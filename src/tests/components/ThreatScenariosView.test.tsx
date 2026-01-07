import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThreatScenariosView } from '../../components/ThreatScenariosView';
import { Project, Impact } from '../../types';

describe('ThreatScenariosView', () => {
  const createMockProject = (overrides?: Partial<Project>): Project => ({
    id: 'proj-1',
    name: 'Test Project',
    methodology: 'TARA' as any,
    organizationId: '',
    scope: '',
    threats: [],
    damageScenarios: [
      {
        id: 'DS_001',
        name: 'Damage Scenario 1',
        description: 'Damage scenario 1',
        impactCategory: 'financial',
        impact: Impact.MAJOR,
        reasoning: 'Test reasoning',
        comment: 'Test comment',
      },
    ],
    misuseCases: [],
    assumptions: [],
    securityGoals: [],
    securityControls: [],
    securityClaims: [],
    threatScenarios: [
      {
        id: 'TS_001',
        threatId: 'THR_001',
        name: 'Threat Scenario 1',
        description: 'First threat scenario',
        damageScenarioIds: ['DS_001'],
        attackPotential: {
          time: 3,
          expertise: 2,
          knowledge: 2,
          access: 1,
          equipment: 2,
        },
        comment: 'TS comment 1',
      },
      {
        id: 'TS_002',
        threatId: 'THR_002',
        name: 'Threat Scenario 2',
        description: 'Second threat scenario',
        damageScenarioIds: [],
        attackPotential: {
          time: 1,
          expertise: 1,
          knowledge: 1,
          access: 2,
          equipment: 1,
        },
        comment: 'TS comment 2',
      },
    ],
    relatedDocuments: [],
    needs: [],
    toeConfigurations: [],
    history: [],
    ...overrides,
  });

  it('should render threat scenarios component', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Threat Scenarios')).toBeInTheDocument();
  });

  it('should select first scenario by default', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Threat Scenario 1')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different scenario', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    expect(screen.getByDisplayValue('Threat Scenario 1')).toBeInTheDocument();

    const secondScenarioLink = screen.getByText('Threat Scenario 2');
    fireEvent.click(secondScenarioLink);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Threat Scenario 2')).toBeInTheDocument();
    });
  });

  it('should allow editing scenario fields when not read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Threat Scenario 1') as HTMLInputElement;
    expect(nameInput).not.toBeDisabled();
  });

  it('should not update if scenario name is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Threat Scenario 1') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Threat Scenario 1' } });

    expect(mockOnUpdateProject).not.toHaveBeenCalled();
  });

  it('should disable modifications when read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const inputs = screen.getAllByDisplayValue(/Threat Scenario/);
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('should render empty state when no scenarios', () => {
    const mockProject = createMockProject({ threatScenarios: [] });
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Threat Scenarios')).toBeInTheDocument();
  });

  it('should display scenario properties correctly', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <ThreatScenariosView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('First threat scenario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TS comment 1')).toBeInTheDocument();
  });
});
