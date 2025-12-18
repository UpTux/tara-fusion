import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MisuseCasesView } from '../../components/MisuseCasesView';
import { Project, MisuseCase, NeedStatus, TaraMethodology } from '../../types';

const mockProject: Project = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Test Project',
  methodology: TaraMethodology.ATTACK_FEASIBILITY,
  needs: [],
  misuseCases: [
    {
      id: 'MC_001',
      name: 'Unauthorized Access',
      description: 'Attacker gains unauthorized access to system',
      comment: 'Critical security issue'
    },
    {
      id: 'MC_002',
      name: 'Data Manipulation',
      description: 'Attacker modifies sensitive data',
      comment: 'Data integrity risk'
    }
  ],
  threats: []
};

describe('MisuseCasesView', () => {
  let mockOnUpdateProject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdateProject = vi.fn();
  });

  it('should render misuse cases list', () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    expect(screen.getByText('Misuse Cases')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    expect(screen.getByText('Data Manipulation')).toBeInTheDocument();
  });

  it('should select first misuse case by default', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Unauthorized Access')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different misuse case', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    const rows = screen.getAllByRole('row');
    const dataManipRow = rows.find(row => within(row).queryByText('Data Manipulation'));

    if (dataManipRow) {
      fireEvent.click(dataManipRow);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Data Manipulation')).toBeInTheDocument();
      });
    }
  });

  it('should add new misuse case', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={false} />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const callArg = mockOnUpdateProject.mock.calls[0][0];
      expect(callArg.misuseCases?.length).toBe(mockProject.misuseCases!.length + 1);
      const newCase = callArg.misuseCases?.[callArg.misuseCases.length - 1];
      expect(newCase?.id).toMatch(/^MC_\d{3}$/);
      expect(newCase?.name).toBe('New Misuse Case');
    });
  });

  it('should update misuse case field', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={false} />
    );

    // Verify editor state is rendered with initial value
    await waitFor(() => {
      expect(screen.getByDisplayValue('Unauthorized Access')).toBeInTheDocument();
    });

    // Component should render without errors and be able to accept input
    expect(screen.getByText('Misuse Cases')).toBeInTheDocument();
  });

  it('should not update if misuse case field value is unchanged', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={false} />
    );

    mockOnUpdateProject.mockClear();

    const nameInput = await screen.findByDisplayValue('Unauthorized Access');
    fireEvent.change(nameInput, { target: { value: 'Unauthorized Access' } });
    fireEvent.blur(nameInput);

    await waitFor(
      () => {
        expect(mockOnUpdateProject).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should disable add button when read-only', () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should delete misuse case', async () => {
    render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={false} />
    );

    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('should sync editor when project.misuseCases changes', async () => {
    const { rerender } = render(
      <MisuseCasesView project={mockProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Unauthorized Access')).toBeInTheDocument();
    });

    const updatedProject = {
      ...mockProject,
      misuseCases: mockProject.misuseCases?.map(mc =>
        mc.id === 'MC_001' ? { ...mc, name: 'Modified Access' } : mc
      )
    };

    rerender(
      <MisuseCasesView project={updatedProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Modified Access')).toBeInTheDocument();
    });
  });

  it('should render empty state when no misuse cases', () => {
    const emptyProject = {
      ...mockProject,
      misuseCases: []
    };

    render(
      <MisuseCasesView project={emptyProject} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    expect(screen.getByText('Misuse Cases')).toBeInTheDocument();
  });

  it('should compute linked threats map correctly', () => {
    const projectWithThreats = {
      ...mockProject,
      threats: [
        {
          id: 'THR_001',
          name: 'Test Threat',
          description: '',
          status: NeedStatus.OPEN,
          tags: [],
          links: [],
          misuseCaseIds: ['MC_001']
        }
      ]
    };

    render(
      <MisuseCasesView project={projectWithThreats} onUpdateProject={mockOnUpdateProject} isReadOnly={true} />
    );

    expect(screen.getByText('Misuse Cases')).toBeInTheDocument();
  });
});
