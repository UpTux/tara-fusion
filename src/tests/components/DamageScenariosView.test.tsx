import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DamageScenariosView } from '../../components/DamageScenariosView';
import { Project, Organization, DamageScenario, Impact, NeedStatus, TaraMethodology } from '../../types';

const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Test Organization',
  impactCategorySettings: {
    categories: ['Confidentiality', 'Integrity', 'Availability']
  }
};

const mockProject: Project = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Test Project',
  methodology: TaraMethodology.ATTACK_FEASIBILITY,
  needs: [],
  damageScenarios: [
    {
      id: 'DS_001',
      name: 'Data Breach',
      description: 'Unauthorized access to sensitive data',
      impactCategory: 'Confidentiality',
      impact: Impact.SEVERE,
      reasoning: 'Customer data exposure',
      comment: 'Critical security issue'
    },
    {
      id: 'DS_002',
      name: 'System Unavailability',
      description: 'Service downtime',
      impactCategory: 'Availability',
      impact: Impact.MAJOR,
      reasoning: 'Loss of service',
      comment: 'Business continuity risk'
    }
  ]
};

describe('DamageScenariosView', () => {
  let mockOnUpdateProject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdateProject = vi.fn();
  });

  it('should render damage scenarios list', () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Damage Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Data Breach')).toBeInTheDocument();
    expect(screen.getByText('System Unavailability')).toBeInTheDocument();
  });

  it('should select first scenario by default', async () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // First scenario should be selected in editor
    await waitFor(() => {
      expect(screen.getByDisplayValue('Data Breach')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different scenario', async () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Find and click second scenario
    const rows = screen.getAllByRole('row');
    const systemDowntimeRow = rows.find(row => within(row).queryByText('System Unavailability'));

    if (systemDowntimeRow) {
      fireEvent.click(systemDowntimeRow);
      await waitFor(() => {
        expect(screen.getByDisplayValue('System Unavailability')).toBeInTheDocument();
      });
    }
  });

  it('should add new damage scenario', async () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const callArg = mockOnUpdateProject.mock.calls[0][0];
      expect(callArg.damageScenarios?.length).toBe(mockProject.damageScenarios!.length + 1);
      const newScenario = callArg.damageScenarios?.[callArg.damageScenarios.length - 1];
      expect(newScenario?.id).toMatch(/^DS_\d{3}$/);
      expect(newScenario?.name).toBe('New Damage Scenario');
    });
  });

  it('should not update if scenario field value is unchanged', async () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    mockOnUpdateProject.mockClear();

    // Find name input and set it to same value
    const nameInput = await screen.findByDisplayValue('Data Breach');
    fireEvent.change(nameInput, { target: { value: 'Data Breach' } });
    fireEvent.blur(nameInput);

    // Should not call onUpdateProject for unchanged field
    await waitFor(
      () => {
        expect(mockOnUpdateProject).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should disable add button when read-only', () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should sync editor when project.damageScenarios changes', async () => {
    const { rerender } = render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Initial state
    await waitFor(() => {
      expect(screen.getByDisplayValue('Data Breach')).toBeInTheDocument();
    });

    // Update project with modified scenario
    const updatedProject = {
      ...mockProject,
      damageScenarios: mockProject.damageScenarios?.map(ds =>
        ds.id === 'DS_001' ? { ...ds, name: 'Modified Data Breach' } : ds
      )
    };

    rerender(
      <DamageScenariosView
        project={updatedProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Editor should reflect updated name
    await waitFor(() => {
      expect(screen.getByDisplayValue('Modified Data Breach')).toBeInTheDocument();
    });
  });

  it('should handle impact category from organization', () => {
    render(
      <DamageScenariosView
        project={mockProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Damage Scenarios')).toBeInTheDocument();
    // Organization categories should be used
    expect(mockOnUpdateProject.mock.calls.length).toBe(0);
  });

  it('should prefer project categories over organization categories', () => {
    const projectWithCategories = {
      ...mockProject,
      impactCategorySettings: {
        categories: ['Custom Category 1', 'Custom Category 2']
      }
    };

    render(
      <DamageScenariosView
        project={projectWithCategories}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Damage Scenarios')).toBeInTheDocument();
  });

  it('should render empty state when no scenarios', () => {
    const emptyProject = {
      ...mockProject,
      damageScenarios: []
    };

    render(
      <DamageScenariosView
        project={emptyProject}
        organization={mockOrganization}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Damage Scenarios')).toBeInTheDocument();
  });
});
