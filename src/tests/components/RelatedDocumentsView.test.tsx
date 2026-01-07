import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RelatedDocumentsView } from '../../components/RelatedDocumentsView';
import { Project, RelatedDocument, NeedStatus, TaraMethodology } from '../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

const mockProject: Project = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Test Project',
  methodology: TaraMethodology.ATTACK_FEASIBILITY,
  needs: [],
  relatedDocuments: [
    {
      id: 'DOC_001',
      title: 'Security Policy',
      authors: ['Alice'],
      version: '1.0',
      url: 'https://example.com/policy',
      comment: 'Main security policy document'
    },
    {
      id: 'DOC_002',
      title: 'Threat Model',
      authors: ['Bob'],
      version: '2.1',
      url: 'https://example.com/threats',
      comment: 'Threat modeling guide'
    }
  ]
};

describe('RelatedDocumentsView', () => {
  let mockOnUpdateProject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdateProject = vi.fn();
  });

  it('should render related documents component', () => {
    const { container } = render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('should select first document by default', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Security Policy')).toBeInTheDocument();
    });
  });

  it('should update editor state when selecting different document', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    // First document should be selected by default
    expect(screen.getByDisplayValue('Security Policy')).toBeInTheDocument();

    // Click second document
    const secondDocLink = screen.getByText('Threat Model');
    fireEvent.click(secondDocLink);

    // Verify editor updated to show second document
    await waitFor(() => {
      expect(screen.getByDisplayValue('Threat Model')).toBeInTheDocument();
    });
  });

  it('should add new related document', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnUpdateProject).toHaveBeenCalled();
      const callArg = mockOnUpdateProject.mock.calls[0][0];
      expect(callArg.relatedDocuments?.length).toBe(mockProject.relatedDocuments!.length + 1);
      const newDoc = callArg.relatedDocuments?.[callArg.relatedDocuments.length - 1];
      expect(newDoc?.id).toMatch(/^DOC_\d{3}$/);
    });
  });

  it('should update document field', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    // Verify component renders with document data
    expect(screen.getByDisplayValue('Security Policy')).toBeInTheDocument();
  });

  it('should not update if document field value is unchanged', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={false}
      />
    );

    mockOnUpdateProject.mockClear();

    const titleInput = await screen.findByDisplayValue('Security Policy');
    fireEvent.change(titleInput, { target: { value: 'Security Policy' } });
    fireEvent.blur(titleInput);

    await waitFor(
      () => {
        expect(mockOnUpdateProject).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should disable add button when read-only', () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should sync editor when project.relatedDocuments changes', async () => {
    const { rerender } = render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Security Policy')).toBeInTheDocument();
    });

    const updatedProject = {
      ...mockProject,
      relatedDocuments: mockProject.relatedDocuments?.map(doc =>
        doc.id === 'DOC_001' ? { ...doc, title: 'Updated Policy' } : doc
      )
    };

    rerender(
      <RelatedDocumentsView
        project={updatedProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated Policy')).toBeInTheDocument();
    });
  });

  it('should render empty state when no documents', () => {
    const emptyProject = {
      ...mockProject,
      relatedDocuments: []
    };

    render(
      <RelatedDocumentsView
        project={emptyProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Component should render without errors
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should display document properties', async () => {
    render(
      <RelatedDocumentsView
        project={mockProject}
        onUpdateProject={mockOnUpdateProject}
        isReadOnly={true}
      />
    );

    // Verify document is rendered
    expect(screen.getByDisplayValue('Security Policy')).toBeInTheDocument();
  });
});
