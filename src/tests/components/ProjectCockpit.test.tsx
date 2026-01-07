import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProjectCockpit } from '../../components/ProjectCockpit';
import { Project, ProjectStatus } from '../../types';

describe('ProjectCockpit', () => {
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
    securityManager: 'John Doe',
    comment: 'Test comment',
    projectStatus: ProjectStatus.IN_PROGRESS,
    ...overrides,
  });

  it('should render project cockpit', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
  });

  it('should update local state when project prop changes', async () => {
    const { rerender } = render(
      <ProjectCockpit
        project={createMockProject({ name: 'Original' })}
        onProjectChange={vi.fn()}
        isReadOnly={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
    });

    rerender(
      <ProjectCockpit
        project={createMockProject({ name: 'Updated' })}
        onProjectChange={vi.fn()}
        isReadOnly={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    });
  });

  it('should allow editing when not read-only', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
    expect(nameInput).not.toBeDisabled();
  });

  it('should not update if value is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
    fireEvent.blur(nameInput, { target: { value: 'Test Project' } });

    expect(mockOnProjectChange).toHaveBeenCalledWith('name', 'Test Project');
  });

  it('should disable modifications when read-only', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
    expect(nameInput).toBeDisabled();
  });

  it('should render security manager field', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('should render comment field', () => {
    const mockProject = createMockProject();
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Test comment')).toBeInTheDocument();
  });

  it('should handle empty security manager', () => {
    const mockProject = createMockProject({ securityManager: undefined });
    const mockOnProjectChange = vi.fn();

    render(
      <ProjectCockpit
        project={mockProject}
        onProjectChange={mockOnProjectChange}
        isReadOnly={false}
      />
    );

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const securityManagerInput = inputs.find(input => input.placeholder === 'enterName');
    expect(securityManagerInput?.value).toBe('');
  });
});
