import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SecurityGoalsView } from '../../components/SecurityGoalsView';
import { Project } from '../../types';

describe('SecurityGoalsView', () => {
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
    securityGoals: [
      {
        id: 'SG_001',
        name: 'Confidentiality',
        responsible: 'Team A',
        requirementsLink: 'REQ-001',
        comment: 'Maintain confidentiality',
      },
      {
        id: 'SG_002',
        name: 'Integrity',
        responsible: 'Team B',
        requirementsLink: 'REQ-002',
        comment: 'Maintain integrity',
      },
    ],
    securityControls: [],
    securityClaims: [],
    threatScenarios: [],
    relatedDocuments: [],
    needs: [],
    toeConfigurations: [],
    history: [],
    ...overrides,
  });

  it('should render security goals component', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Goals')).toBeInTheDocument();
  });

  it('should select first goal by default', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Confidentiality')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different goal', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    expect(screen.getByDisplayValue('Confidentiality')).toBeInTheDocument();

    const secondGoalLink = screen.getByText('Integrity');
    fireEvent.click(secondGoalLink);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Integrity')).toBeInTheDocument();
    });
  });

  it('should add new security goal', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security goal/i });
    fireEvent.click(addButton);

    expect(mockOnUpdateProject).toHaveBeenCalled();
    const updatedProject = mockOnUpdateProject.mock.calls[0][0];
    expect(updatedProject.securityGoals).toHaveLength(3);
  });

  it('should allow editing goal fields when not read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Confidentiality') as HTMLInputElement;
    expect(nameInput).not.toBeDisabled();
  });

  it('should not update if goal name is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Confidentiality') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Confidentiality' } });

    expect(mockOnUpdateProject).not.toHaveBeenCalled();
  });

  it('should disable add button when read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security goal/i });
    expect(addButton).toBeDisabled();
  });

  it('should render empty state when no goals', () => {
    const mockProject = createMockProject({ securityGoals: [] });
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Goals')).toBeInTheDocument();
  });

  it('should display goal properties correctly', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityGoalsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('REQ-001')).toBeInTheDocument();
  });
});
