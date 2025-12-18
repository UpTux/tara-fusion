import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PieChart } from '../../../components/charts/PieChart';

describe('PieChart', () => {
    it('should render pie chart with data', () => {
        const data = [
            { label: 'Category A', value: 30, color: '#ff0000' },
            { label: 'Category B', value: 50, color: '#00ff00' },
            { label: 'Category C', value: 20, color: '#0000ff' },
        ];

        const { container } = render(<PieChart data={data} />);

        // Check that all labels are rendered in the legend
        const legend = container.querySelector('.flex.flex-col');
        expect(legend).toBeInTheDocument();
        expect(legend?.textContent).toContain('Category A:');
        expect(legend?.textContent).toContain('Category B:');
        expect(legend?.textContent).toContain('Category C:');

        // Check that percentages are displayed
        expect(legend?.textContent).toContain('30%');
        expect(legend?.textContent).toContain('50%');
        expect(legend?.textContent).toContain('20%');
    });

    it('should render SVG with correct structure', () => {
        const data = [
            { label: 'Test', value: 100, color: '#ff0000' },
        ];

        const { container } = render(<PieChart data={data} />);

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('viewBox', '-1 -1 2 2');
        expect(svg).toHaveAttribute('aria-label', 'Pie chart');
        expect(svg).toHaveAttribute('role', 'img');
    });

    it('should handle empty data (zero total)', () => {
        const data = [
            { label: 'Zero A', value: 0, color: '#ff0000' },
            { label: 'Zero B', value: 0, color: '#00ff00' },
        ];

        render(<PieChart data={data} />);

        expect(screen.getByText('No data to display.')).toBeInTheDocument();
    });

    it('should handle single slice', () => {
        const data = [
            { label: 'Single', value: 100, color: '#ff0000' },
        ];

        const { container } = render(<PieChart data={data} />);

        const legend = container.querySelector('.flex.flex-col');
        expect(legend?.textContent).toContain('Single:');
        expect(legend?.textContent).toContain('100%');
    });

    it('should calculate percentages correctly', () => {
        const data = [
            { label: 'A', value: 25, color: '#ff0000' },
            { label: 'B', value: 25, color: '#00ff00' },
            { label: 'C', value: 25, color: '#0000ff' },
            { label: 'D', value: 25, color: '#ffff00' },
        ];

        render(<PieChart data={data} />);

        // Each should be 25%
        const percentages = screen.getAllByText('25%');
        expect(percentages).toHaveLength(4);
    });

    it('should render color indicators', () => {
        const data = [
            { label: 'Red', value: 50, color: '#ff0000' },
            { label: 'Blue', value: 50, color: '#0000ff' },
        ];

        const { container } = render(<PieChart data={data} />);

        const colorSpans = container.querySelectorAll('span[style*="background-color"]');
        expect(colorSpans).toHaveLength(2);
        expect(colorSpans[0]).toHaveStyle({ backgroundColor: '#ff0000' });
        expect(colorSpans[1]).toHaveStyle({ backgroundColor: '#0000ff' });
    });

    it('should create path elements for each slice', () => {
        const data = [
            { label: 'Slice 1', value: 40, color: '#ff0000' },
            { label: 'Slice 2', value: 60, color: '#00ff00' },
        ];

        const { container } = render(<PieChart data={data} />);

        const paths = container.querySelectorAll('path');
        expect(paths).toHaveLength(2);
    });

    it('should handle fractional values', () => {
        const data = [
            { label: 'Fraction A', value: 33.33, color: '#ff0000' },
            { label: 'Fraction B', value: 66.67, color: '#00ff00' },
        ];

        const { container } = render(<PieChart data={data} />);

        const legend = container.querySelector('.flex.flex-col');
        expect(legend?.textContent).toContain('Fraction A:');
        expect(legend?.textContent).toContain('Fraction B:');
    });

    it('should include title elements for accessibility', () => {
        const data = [
            { label: 'Accessible', value: 100, color: '#ff0000' },
        ];

        const { container } = render(<PieChart data={data} />);

        const title = container.querySelector('title');
        expect(title).toBeInTheDocument();
        expect(title?.textContent).toContain('Accessible');
        expect(title?.textContent).toContain('100.0%');
    });

    it('should handle large arc flag correctly for slices > 50%', () => {
        const data = [
            { label: 'Large', value: 75, color: '#ff0000' },
            { label: 'Small', value: 25, color: '#00ff00' },
        ];

        const { container } = render(<PieChart data={data} />);

        const paths = container.querySelectorAll('path');
        expect(paths).toHaveLength(2);
        
        // First path should have large arc flag (1) since it's 75%
        const largePath = paths[0].getAttribute('d');
        expect(largePath).toContain(' 1 1 '); // Large arc flag = 1
    });

    it('should not mutate during render', () => {
        // This test verifies the fix for the React Compiler error
        const data = [
            { label: 'A', value: 10, color: '#ff0000' },
            { label: 'B', value: 20, color: '#00ff00' },
            { label: 'C', value: 30, color: '#0000ff' },
        ];

        // Render twice to ensure no side effects from mutation
        const { unmount, container: container1 } = render(<PieChart data={data} />);
        const legend1 = container1.querySelector('.flex.flex-col');
        expect(legend1?.textContent).toContain('A:');
        unmount();
        
        const { container: container2 } = render(<PieChart data={data} />);
        const legend2 = container2.querySelector('.flex.flex-col');
        expect(legend2?.textContent).toContain('A:');
        expect(legend2?.textContent).toContain('B:');
        expect(legend2?.textContent).toContain('C:');
    });
});
