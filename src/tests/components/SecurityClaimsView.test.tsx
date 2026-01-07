import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SecurityClaimsView } from '../../components/SecurityClaimsView';
import { Project, SecurityClaim } from '../../types';

describe('SecurityClaimsView', () => {
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
    securityClaims: [
      {
        id: 'SCLM_001',
        name: 'Security Claim A',
        responsible: 'Alice',
        assumptionIds: [],
        comment: 'First security claim',
      },
      {
        id: 'SCLM_002',
        name: 'Security Claim B',
        responsible: 'Bob',
        assumptionIds: [],
        comment: 'Second security claim',
      },
    ],
    threatScenarios: [],
    relatedDocuments: [],
    needs: [],
    toeConfigurations: [],
    history: [],
    ...overrides,
  });

  it('should render security claims component', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Claims')).toBeInTheDocument();
  });

  it('should select first claim by default', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Security Claim A')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different claim', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    expect(screen.getByDisplayValue('Security Claim A')).toBeInTheDocument();

    const secondClaimLink = screen.getByText('Security Claim B');
    fireEvent.click(secondClaimLink);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Security Claim B')).toBeInTheDocument();
    });
  });

  it('should add new security claim', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security claim/i });
    fireEvent.click(addButton);

    expect(mockOnUpdateProject).toHaveBeenCalled();
    const updatedProject = mockOnUpdateProject.mock.calls[0][0];
    expect(updatedProject.securityClaims).toHaveLength(3);
  });

  it('should allow editing claim fields', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Security Claim A') as HTMLInputElement;
    expect(nameInput).not.toBeDisabled();
  });

  it('should not update if claim name is unchanged', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const nameInput = screen.getByDisplayValue('Security Claim A') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Security Claim A' } });

    // Should not be called for unchanged values
    expect(mockOnUpdateProject).not.toHaveBeenCalled();
  });

  it('should disable add button when read-only', () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByRole('button', { name: /add new security claim/i });
    expect(addButton).toBeDisabled();
  });

  it('should render empty state when no claims', () => {
    const mockProject = createMockProject({ securityClaims: [] });
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByText('Security Claims')).toBeInTheDocument();
  });

  it('should display claim properties correctly', async () => {
    const mockProject = createMockProject();
    const mockOnUpdateProject = vi.fn();

    render(
      <SecurityClaimsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('First security claim')).toBeInTheDocument();
  });
});
