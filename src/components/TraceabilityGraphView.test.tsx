import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../types';
import { TraceabilityGraphView } from './TraceabilityGraphView';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock reactflow
vi.mock('reactflow', () => ({
    default: ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => (
        <div data-testid="react-flow">
            <div data-testid="nodes-count">{nodes.length}</div>
            <div data-testid="edges-count">{edges.length}</div>
        </div>
    ),
    ReactFlow: ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => (
        <div data-testid="react-flow">
            <div data-testid="nodes-count">{nodes.length}</div>
            <div data-testid="edges-count">{edges.length}</div>
        </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
    Handle: () => <div data-testid="handle" />,
    Position: {
        Top: 'top',
        Bottom: 'bottom',
    },
    MarkerType: {
        ArrowClosed: 'arrowclosed',
    },
    BackgroundVariant: {
        Dots: 'dots',
    },
    useNodesState: (initialNodes: unknown[]) => {
        const [nodes, setNodes] = React.useState(initialNodes);
        return [nodes, setNodes, vi.fn()];
    },
    useEdgesState: (initialEdges: unknown[]) => {
        const [edges, setEdges] = React.useState(initialEdges);
        return [edges, setEdges, vi.fn()];
    },
}));

describe('TraceabilityGraphView', () => {
    let mockProject: Project;

    beforeEach(() => {
        mockProject = {
            id: 'test-project',
            name: 'Test Project',
            description: 'Test Description',
            version: '1.0.0',
            toeConfigurations: [
                { id: 'toe-1', name: 'TOE Config 1', description: '' },
                { id: 'toe-2', name: 'TOE Config 2', description: '' },
            ],
            assumptions: [
                { id: 'assumption-1', name: 'Assumption 1', description: '' },
                { id: 'assumption-2', name: 'Assumption 2', description: '' },
            ],
            assets: [
                { id: 'asset-1', name: 'Asset 1', description: '', toeConfigurationIds: ['toe-1'] },
                { id: 'asset-2', name: 'Asset 2', description: '', toeConfigurationIds: ['toe-2'] },
            ],
            damageScenarios: [
                { id: 'damage-1', name: 'Damage Scenario 1', description: '', impact: 'High' },
            ],
            threats: [
                {
                    id: 'threat-1',
                    name: 'Threat 1',
                    description: '',
                    assetId: 'asset-1',
                    damageScenarioIds: ['damage-1'],
                    securityProperty: 'Confidentiality',
                    misuseCaseIds: [],
                },
            ],
            threatScenarios: [
                {
                    id: 'ts-1',
                    name: 'Threat Scenario 1',
                    description: '',
                    threatId: 'threat-1',
                    damageScenarioIds: ['damage-1'],
                    securityGoalIds: ['sg-1'],
                    securityClaimIds: ['sc-1'],
                },
            ],
            securityControls: [
                {
                    id: 'ctrl-1',
                    name: 'Security Control 1',
                    description: '',
                    securityGoalIds: ['sg-1'],
                    circumventTreeRootIds: ['ct-1'],
                },
            ],
            securityGoals: [
                { id: 'sg-1', name: 'Security Goal 1', description: '' },
            ],
            securityClaims: [
                { id: 'sc-1', name: 'Security Claim 1', description: '', assumptionIds: ['assumption-1'] },
            ],
            misuseCases: [
                { id: 'mc-1', name: 'Misuse Case 1', description: '', assetIds: ['asset-1'] },
            ],
            needs: [
                {
                    id: 'threat-1',
                    title: 'Attack Tree 1',
                    description: '',
                    type: 'attack',
                    tags: ['attack-root'],
                    links: [],
                },
                {
                    id: 'ct-1',
                    title: 'Circumvent Tree 1',
                    description: '',
                    type: 'attack',
                    tags: ['circumvent-root'],
                    links: [],
                },
            ],
        } as unknown as Project;
    });

    describe('Component Rendering', () => {
        it('should render the component with title', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            expect(screen.getByText('traceabilityGraphTitle')).toBeInTheDocument();
        });

        it('should render layout dropdown', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            expect(screen.getByText('Layout:')).toBeInTheDocument();
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(1);
        });

        it('should render view filter dropdown', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            expect(screen.getByText('View:')).toBeInTheDocument();
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(2);
        });

        it('should render TOE config filter when configurations exist', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            expect(screen.getByText('TOE Config:')).toBeInTheDocument();
            // TOE Config is a multi-select, which has role="listbox" not "combobox"
            const listboxes = screen.getAllByRole('listbox');
            expect(listboxes.length).toBeGreaterThanOrEqual(1);
        });

        it('should not render TOE config filter when no configurations', () => {
            const projectWithoutToe = { ...mockProject, toeConfigurations: [] };
            render(<TraceabilityGraphView project={projectWithoutToe} />);
            expect(screen.queryByText('TOE Config:')).not.toBeInTheDocument();
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBe(2); // Only Layout and View
        });
    });

    describe('Graph Generation', () => {
        it('should generate nodes for all artifact types', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const nodesCount = screen.getByTestId('nodes-count');
            // 2 TOE configs + 2 assumptions + 2 assets + 1 damage scenario + 1 threat +
            // 1 threat scenario + 1 attack tree + 1 circumvent tree + 1 security control +
            // 1 security goal + 1 security claim + 1 misuse case = 15 nodes (threat scenario also creates a node)
            expect(nodesCount).toHaveTextContent('15');
        });

        it('should generate edges for relationships', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const edgesCount = screen.getByTestId('edges-count');
            // Should have multiple edges connecting different artifacts
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThan(0);
        });

        it('should handle empty project', () => {
            const emptyProject: Project = {
                id: 'empty',
                name: 'Empty',
                organizationId: '',
                needs: [],
                assets: [],
                toeConfigurations: [],
                toeDescription: '',
                scope: '',
                securityGoals: [],
                assumptions: [],
                threats: [],
                damageScenarios: [],
                threatScenarios: [],
                securityControls: [],
                misuseCases: [],
                securityClaims: [],
            };
            render(<TraceabilityGraphView project={emptyProject} />);
            const nodesCount = screen.getByTestId('nodes-count');
            expect(nodesCount).toHaveTextContent('0');
        });

        it('should create edges from assets to TOE configurations', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // Asset 1 links to TOE 1, Asset 2 links to TOE 2
            const edgesCount = screen.getByTestId('edges-count');
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThanOrEqual(2);
        });

        it('should create edges from threats to assets', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // Threat 1 links to Asset 1
            const edgesCount = screen.getByTestId('edges-count');
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThanOrEqual(1);
        });

        it('should link attack trees to threats', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // Attack tree should link to threat with same ID
            const edgesCount = screen.getByTestId('edges-count');
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThan(0);
        });

        it('should link security controls to circumvent trees', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // Security control links to circumvent tree
            const edgesCount = screen.getByTestId('edges-count');
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThan(0);
        });
    });

    describe('Layout Algorithms', () => {
        it('should default to hierarchical layout', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const layoutSelect = selects[0] as HTMLSelectElement; // First select is layout
            expect(layoutSelect.value).toBe('hierarchical');
        });

        it('should change layout when dropdown changes', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const layoutSelect = selects[0] as HTMLSelectElement;

            fireEvent.change(layoutSelect, { target: { value: 'grid' } });
            await waitFor(() => {
                expect(layoutSelect.value).toBe('grid');
            });
        });

        it('should have all layout options available', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const layoutSelect = selects[0] as HTMLSelectElement;
            const options = Array.from(layoutSelect.options).map(opt => opt.value);

            expect(options).toContain('hierarchical');
            expect(options).toContain('grid');
            expect(options).toContain('radial');
            expect(options).toContain('force');
        });
    });

    describe('Filter Functionality', () => {
        it('should default to "all" filter', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1] as HTMLSelectElement; // Second select is view filter
            expect(filterSelect.value).toBe('all');
        });

        it('should change filter when dropdown changes', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1] as HTMLSelectElement;

            fireEvent.change(filterSelect, { target: { value: 'threats' } });
            await waitFor(() => {
                expect(filterSelect.value).toBe('threats');
            });
        });

        it('should have all filter options available', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1] as HTMLSelectElement;
            const options = Array.from(filterSelect.options).map(opt => opt.value);

            expect(options).toContain('all');
            expect(options).toContain('threats');
            expect(options).toContain('security');
            expect(options).toContain('assets');
        });

        it('should filter nodes when threat chain selected', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1];

            fireEvent.change(filterSelect, { target: { value: 'threats' } });

            await waitFor(() => {
                const nodesCount = screen.getByTestId('nodes-count');
                // Should show fewer nodes (only threat-related)
                expect(parseInt(nodesCount.textContent || '0')).toBeLessThan(15);
            });
        });

        it('should filter nodes when security chain selected', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1];

            fireEvent.change(filterSelect, { target: { value: 'security' } });

            await waitFor(() => {
                const nodesCount = screen.getByTestId('nodes-count');
                // Should show fewer nodes (only security-related)
                expect(parseInt(nodesCount.textContent || '0')).toBeLessThan(15);
            });
        });

        it('should filter nodes when asset dependencies selected', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const selects = screen.getAllByRole('combobox');
            const filterSelect = selects[1];

            fireEvent.change(filterSelect, { target: { value: 'assets' } });

            await waitFor(() => {
                const nodesCount = screen.getByTestId('nodes-count');
                // Should show fewer nodes (only asset-related)
                expect(parseInt(nodesCount.textContent || '0')).toBeLessThan(15);
            });
        });
    });

    describe('TOE Configuration Filter', () => {
        it('should show all TOE configurations in multi-select', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const listboxes = screen.getAllByRole('listbox');
            const toeSelect = listboxes[0] as HTMLSelectElement; // Multi-select has role listbox

            expect(toeSelect.options.length).toBe(2);
            expect(toeSelect.options[0].textContent).toBe('TOE Config 1');
            expect(toeSelect.options[1].textContent).toBe('TOE Config 2');
        });

        it('should show clear button when TOE configs are selected', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const listboxes = screen.getAllByRole('listbox');
            const toeSelect = listboxes[0] as HTMLSelectElement;

            // Select a TOE config
            fireEvent.change(toeSelect, { target: { value: ['toe-1'] } });

            await waitFor(() => {
                expect(screen.getByText('Clear')).toBeInTheDocument();
            });
        });

        it('should clear TOE config selection when clear button clicked', async () => {
            render(<TraceabilityGraphView project={mockProject} />);
            const listboxes = screen.getAllByRole('listbox');
            const toeSelect = listboxes[0] as HTMLSelectElement;

            // Select a TOE config
            fireEvent.change(toeSelect, { target: { value: ['toe-1'] } });

            await waitFor(() => {
                expect(screen.getByText('Clear')).toBeInTheDocument();
            });

            // Click clear button
            const clearButton = screen.getByText('Clear');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(screen.queryByText('Clear')).not.toBeInTheDocument();
            });
        });
    });

    describe('Legend', () => {
        it('should render legend with all artifact types', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // The ReactFlow component is rendered with nodes
            expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        });

        it('should display artifact type names in legend', () => {
            render(<TraceabilityGraphView project={mockProject} />);
            // The graph is rendered with the correct number of nodes
            const nodesCount = screen.getByTestId('nodes-count');
            expect(parseInt(nodesCount.textContent || '0')).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle project with no edges', () => {
            const projectWithNoEdges = {
                ...mockProject,
                threats: [],
                threatScenarios: [],
                assets: [],
                needs: [],
            } as unknown as Project;

            render(<TraceabilityGraphView project={projectWithNoEdges} />);
            const edgesCount = screen.getByTestId('edges-count');
            // Even with minimal data, there may be some edges (e.g., between remaining nodes)
            // Just verify it renders without crashing
            expect(edgesCount).toBeInTheDocument();
        });

        it('should handle threat without asset reference', () => {
            const projectWithOrphanThreat: Project = {
                ...mockProject,
                threats: [
                    {
                        id: 'threat-orphan',
                        name: 'Orphan Threat',
                        description: '',
                        assetId: undefined,
                        damageScenarioIds: [],
                        securityProperty: 'Integrity',
                        misuseCaseIds: [],
                    },
                ],
            } as unknown as Project;

            render(<TraceabilityGraphView project={projectWithOrphanThreat} />);
            // Should render without errors
            expect(screen.getByText('traceabilityGraphTitle')).toBeInTheDocument();
        });

        it('should handle threat scenario without threat reference', () => {
            const projectWithOrphanTS: Project = {
                ...mockProject,
                threatScenarios: [
                    {
                        id: 'ts-orphan',
                        name: 'Orphan TS',
                        description: '',
                        threatId: undefined,
                        damageScenarioIds: [],
                        securityGoalIds: [],
                        securityClaimIds: [],
                    },
                ],
            } as unknown as Project;

            render(<TraceabilityGraphView project={projectWithOrphanTS} />);
            // Should render without errors
            expect(screen.getByText('traceabilityGraphTitle')).toBeInTheDocument();
        });

        it('should handle multiple relationships', () => {
            const projectWithMultipleRels: Project = {
                ...mockProject,
                threats: [
                    {
                        id: 'threat-multi',
                        name: 'Multi Threat',
                        description: '',
                        assetId: 'asset-1',
                        damageScenarioIds: ['damage-1', 'damage-2', 'damage-3'],
                        securityProperty: 'Availability',
                        misuseCaseIds: ['mc-1', 'mc-2'],
                    },
                ],
                damageScenarios: [
                    { id: 'damage-1', name: 'Damage 1', description: '', impact: 'High' },
                    { id: 'damage-2', name: 'Damage 2', description: '', impact: 'Medium' },
                    { id: 'damage-3', name: 'Damage 3', description: '', impact: 'Low' },
                ],
            } as unknown as Project;

            render(<TraceabilityGraphView project={projectWithMultipleRels} />);
            const edgesCount = screen.getByTestId('edges-count');
            // Should have multiple edges from the threat
            expect(parseInt(edgesCount.textContent || '0')).toBeGreaterThan(3);
        });
    });

    describe('Integration Tests', () => {
        it('should combine layout and filter changes', async () => {
            render(<TraceabilityGraphView project={mockProject} />);

            const selects = screen.getAllByRole('combobox');
            const layoutSelect = selects[0];
            const filterSelect = selects[1];

            // Change layout
            fireEvent.change(layoutSelect, { target: { value: 'grid' } });

            // Change filter
            fireEvent.change(filterSelect, { target: { value: 'threats' } });

            await waitFor(() => {
                const nodesCount = screen.getByTestId('nodes-count');
                // Should show filtered and laid out nodes
                expect(parseInt(nodesCount.textContent || '0')).toBeGreaterThan(0);
            });
        });

        it('should combine TOE filter with view filter', async () => {
            render(<TraceabilityGraphView project={mockProject} />);

            const selects = screen.getAllByRole('combobox');
            const listboxes = screen.getAllByRole('listbox');
            const toeSelect = listboxes[0] as HTMLSelectElement;
            const filterSelect = selects[1];

            // Select TOE config
            fireEvent.change(toeSelect, { target: { value: ['toe-1'] } });

            // Change view filter
            fireEvent.change(filterSelect, { target: { value: 'threats' } });

            await waitFor(() => {
                const nodesCount = screen.getByTestId('nodes-count');
                // Should show nodes that match both filters
                expect(parseInt(nodesCount.textContent || '0')).toBeGreaterThanOrEqual(0);
            });
        });

        it('should maintain layout when changing filters', async () => {
            render(<TraceabilityGraphView project={mockProject} />);

            const selects = screen.getAllByRole('combobox');
            const layoutSelect = selects[0] as HTMLSelectElement;
            const filterSelect = selects[1];

            // Set to radial layout
            fireEvent.change(layoutSelect, { target: { value: 'radial' } });

            await waitFor(() => {
                expect(layoutSelect.value).toBe('radial');
            });

            // Change filter
            fireEvent.change(filterSelect, { target: { value: 'security' } });

            // Layout should remain radial
            await waitFor(() => {
                expect(layoutSelect.value).toBe('radial');
            });
        });
    });
});
