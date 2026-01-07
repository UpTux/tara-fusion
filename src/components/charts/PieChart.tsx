import React from 'react';

interface PieChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
}

const PieSlice: React.FC<{
    color: string;
    path: string;
    label: string;
    percentage: string;
}> = ({ color, path, label, percentage }) => (
    <g className="pie-slice-group transform transition-transform duration-300 hover:scale-105">
        <path d={path} fill={color} />
        <title>{`${label}: ${percentage}`}</title>
    </g>
);


export const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-vscode-text-secondary">No data to display.</div>;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    // Pre-calculate cumulative percentages
    const cumulativePercentages: number[] = data.reduce((acc, item, index) => {
        const prevCumulative = index === 0 ? 0 : acc[index - 1];
        const percentage = item.value / total;
        return [...acc, prevCumulative + percentage];
    }, [] as number[]);

    const slices = data.map((item, index) => {
        const percentage = item.value / total;
        const startCumulative = index === 0 ? 0 : cumulativePercentages[index - 1];
        const endCumulative = cumulativePercentages[index];
        
        const [startX, startY] = getCoordinatesForPercent(startCumulative);
        const [endX, endY] = getCoordinatesForPercent(endCumulative);
        const largeArcFlag = percentage > 0.5 ? 1 : 0;

        const path = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

        return {
            path,
            color: item.color,
            label: item.label,
            percentage: `${(percentage * 100).toFixed(1)}%`
        };
    });

    return (
        <div className="flex items-center justify-center space-x-8">
            <svg viewBox="-1 -1 2 2" width="200" height="200" style={{ transform: 'rotate(-90deg)' }} aria-label="Pie chart" role="img">
                {slices.map((slice, index) => (
                    <PieSlice key={index} {...slice} />
                ))}
            </svg>
            <div className="flex flex-col space-y-2 text-sm">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span
                            className="w-3.5 h-3.5 rounded-sm mr-2"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-vscode-text-primary">{item.label}:</span>
                        <span className="font-semibold ml-auto pl-4 text-vscode-text-primary">{(item.value / total * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};