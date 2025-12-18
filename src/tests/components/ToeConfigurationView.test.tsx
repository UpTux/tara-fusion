import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToeConfigurationView } from '../../components/ToeConfigurationView';
import { Project } from '../../types';

const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project',
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
  toeConfigurations: [
    {
      id: 'TOE_CONF_001',
      active: true,
      name: 'Production',
      description: 'Production configuration',
      comment: 'Main production setup'
    },
    {
      id: 'TOE_CONF_002',
      active: false,
      name: 'Test Environment',
      description: 'Test configuration',
      comment: 'For testing'
    },
  ],
  threatScenarios: [],
  relatedDocuments: [],
  needs: [],
  history: [],
  ...overrides,
});

describe('ToeConfigurationView', () => {
  const mockProject = createMockProject();
  const mockOnUpdateProject = vi.fn();

  it('should render toe configuration component', () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('TOE Configurations')).toBeInTheDocument();
  });

  it('should select first configuration by default', async () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Production')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different configuration', async () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    // First configuration should be selected by default
    expect(screen.getByDisplayValue('Production')).toBeInTheDocument();

    // Click second configuration
    const secondConfigLink = screen.getByText('Test Environment');
    fireEvent.click(secondConfigLink);

    // Verify editor updated to show second configuration
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Environment')).toBeInTheDocument();
    });
  });

  it('should add new toe configuration', async () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByTitle('Add new TOE configuration');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const updatedProject = mockOnUpdateProject.mock.calls[0][0];
      expect(updatedProject.toeConfigurations.length).toBe(3);
    });
  });

  it('should update configuration field', async () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Production');
    fireEvent.change(nameInput, { target: { value: 'Updated Production' } });

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
    });
  });

  it('should not update if configuration field value is unchanged', async () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    mockOnUpdateProject.mockClear();
    const nameInput = screen.getByDisplayValue('Production');
    fireEvent.change(nameInput, { target: { value: 'Production' } });

    // Wait a bit to ensure no update is called
    await waitFor(() => {
      expect(mockOnUpdateProject).not.toHaveBeenCalled();
    });
  });

  it('should disable add button when read-only', () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByTitle('Add new TOE configuration');
    expect(addButton).toBeDisabled();
  });

  it('should sync editor when project.toeConfigurations changes', async () => {
    const { rerender } = render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    expect(screen.getByDisplayValue('Production')).toBeInTheDocument();

    const updatedProject = createMockProject({
      toeConfigurations: [
        {
          id: 'TOE_CONF_001',
          active: true,
          name: 'Updated Production Name',
          description: 'Updated description',
          comment: 'Updated comment'
        },
      ],
    });

    rerender(
      <ToeConfigurationView
        project={updatedProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated Production Name')).toBeInTheDocument();
    });
  });

  it('should handle empty configurations gracefully', () => {
    const emptyProject = createMockProject({
      toeConfigurations: [],
    });

    render(
      <ToeConfigurationView
        project={emptyProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Component should render without error with empty list
    expect(screen.getByText('TOE Configurations')).toBeInTheDocument();
  });

  it('should display configuration properties', () => {
    render(
      <ToeConfigurationView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Production')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Production configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main production setup')).toBeInTheDocument();
  });
});
