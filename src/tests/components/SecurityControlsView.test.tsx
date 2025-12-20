import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SecurityControlsView } from '../../components/SecurityControlsView';
import { Project } from '../../types';

describe('SecurityControlsView', () => {
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
    securityControls: [
      {
        id: 'SC_001',
        name: 'Control A',
        description: 'First control',
        activeRRA: true,
        securityGoalIds: [],
        comment: 'Control A comment',
      },
      {
        id: 'SC_002',
        name: 'Control B',
        description: 'Second control',
        activeRRA: false,
        securityGoalIds: [],
        comment: 'Control B comment',
      },
    ],
    securityClaims: [],
    threatScenarios: [],
    relatedDocuments: [],
    needs: [],
    toeConfigurations: [],
    history: [],
    ...overrides,
  });

  it('should render security controls component', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Controls')).toBeInTheDocument();
  });

  it('should select first control by default', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('First control')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different control', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    expect(screen.getByDisplayValue('First control')).toBeInTheDocument();

    const secondControlLink = screen.getByText('Control B');
    fireEvent.click(secondControlLink);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Second control')).toBeInTheDocument();
    });
  });

  it('should add new security control', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security control/i });
    fireEvent.click(addButton);

    expect(mockOnUpdateProject).toHaveBeenCalled();
    const updatedProject = mockOnUpdateProject.mock.calls[0][0];
    expect(updatedProject.securityControls).toHaveLength(3);
  });

  it('should allow editing control fields when not read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const descInput = screen.getByDisplayValue('First control') as HTMLInputElement;
    expect(descInput).not.toBeDisabled();
  });

  it('should not update if control description is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const descInput = screen.getByDisplayValue('First control') as HTMLInputElement;
    fireEvent.change(descInput, { target: { value: 'First control' } });

    expect(mockOnUpdateProject).not.toHaveBeenCalled();
  });

  it('should disable add button when read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security control/i });
    expect(addButton).toBeDisabled();
  });

  it('should render empty state when no controls', () => {
    const mockProject = createMockProject({ securityControls: [] });
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Controls')).toBeInTheDocument();
  });

  it('should display control properties correctly', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityControlsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Control A comment')).toBeInTheDocument();
  });
});
