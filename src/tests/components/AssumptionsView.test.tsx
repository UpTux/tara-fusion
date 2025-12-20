import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Assumption, Project } from '../../types';
import { AssumptionsView } from '../../components/AssumptionsView';

describe('AssumptionsView', () => {
  const mockAssumptions: Assumption[] = [
    {
      id: 'ASS_001',
      active: true,
      name: 'Test Assumption 1',
      toeConfigurationIds: [],
      comment: 'Test comment 1'
    },
    {
      id: 'ASS_002',
      active: false,
      name: 'Test Assumption 2',
      toeConfigurationIds: ['TOE_001'],
      comment: 'Test comment 2'
    }
  ];

  const mockProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    methodology: 'TARA' as any,
    assumptions: mockAssumptions,
    securityGoals: [],
    assets: [],
    damageScenarios: [],
    threatScenarios: [],
    needs: [],
    securityClaims: [],
    securityControls: [],
    misuseCases: [],
    relatedDocuments: [],
    toeConfigurations: [],
    history: [],
    organizationId: ''
  };

  const mockOnUpdateProject = vi.fn();

  it('renders assumptions list', () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    expect(screen.getByText('ASS_001')).toBeInTheDocument();
    expect(screen.getByText('Test Assumption 1')).toBeInTheDocument();
    expect(screen.getByText('ASS_002')).toBeInTheDocument();
    expect(screen.getByText('Test Assumption 2')).toBeInTheDocument();
  });

  it('selects first assumption by default', () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    // First assumption should have the selected class
    const firstRow = screen.getByText('ASS_001').closest('tr');
    expect(firstRow).toHaveClass('bg-vscode-accent/20');
  });

  it('switches selection when clicking another assumption', () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    const secondRow = screen.getByText('ASS_002').closest('tr');
    fireEvent.click(secondRow!);

    // Second assumption should now be selected
    expect(secondRow).toHaveClass('bg-vscode-accent/20');
  });

  it('displays selected assumption details in editor', () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    // Check if first assumption details are displayed
    const idInput = screen.getByDisplayValue('ASS_001');
    expect(idInput).toBeInTheDocument();
    
    const nameInput = screen.getByDisplayValue('Test Assumption 1');
    expect(nameInput).toBeInTheDocument();
  });

  it('creates new assumption when add button is clicked', async () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    const addButton = screen.getByTitle('Add new assumption (Ctrl + N)');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const calls = mockOnUpdateProject.mock.calls;
      const updatedProject = calls[calls.length - 1][0];
      expect(updatedProject.assumptions).toHaveLength(3);
      expect(updatedProject.assumptions[2].id).toBe('ASS_003');
      expect(updatedProject.assumptions[2].name).toBe('New Assumption');
    });
  });

  it('updates assumption when name is changed', async () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    const nameInput = screen.getByDisplayValue('Test Assumption 1');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const calls = mockOnUpdateProject.mock.calls;
      const updatedProject = calls[calls.length - 1][0];
      expect(updatedProject.assumptions[0].name).toBe('Updated Name');
    });
  });

  it('deletes assumption when delete is confirmed', async () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    const deleteButton = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(deleteButton);

    // Confirm deletion: pick the Delete button from the modal (last one)
    const deleteButtons = await screen.findAllByRole('button', { name: /^Delete$/i });
    const confirmButton = deleteButtons[deleteButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const calls = mockOnUpdateProject.mock.calls;
      const updatedProject = calls[calls.length - 1][0];
      expect(updatedProject.assumptions).toHaveLength(1);
      expect(updatedProject.assumptions[0].id).toBe('ASS_002');
    });
  });

  it('disables actions when isReadOnly is true', () => {
    render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={true} 
      />
    );

    const addButton = screen.getByTitle('Add new assumption (Ctrl + N)');
    expect(addButton).toBeDisabled();

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    deleteButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });

    const nameInput = screen.getByDisplayValue('Test Assumption 1');
    expect(nameInput).toBeDisabled();
  });

  it('handles empty assumptions list', () => {
    const emptyProject = { ...mockProject, assumptions: [] };
    
    render(
      <AssumptionsView 
        project={emptyProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    expect(screen.queryByText('ASS_001')).not.toBeInTheDocument();
  });

  it('syncs editor state when project assumptions change', () => {
    const { rerender } = render(
      <AssumptionsView 
        project={mockProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    // Update project with modified assumption
    const updatedProject = {
      ...mockProject,
      assumptions: [
        { ...mockAssumptions[0], name: 'Modified Name' },
        mockAssumptions[1]
      ]
    };

    rerender(
      <AssumptionsView 
        project={updatedProject} 
        onUpdateProject={mockOnUpdateProject} 
        isReadOnly={false} 
      />
    );

    // Editor should show updated name
    expect(screen.getByDisplayValue('Modified Name')).toBeInTheDocument();
  });
});
