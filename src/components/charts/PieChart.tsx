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
    if (total === 0) return <div className="text-center text-gray-500">No data to display.</div>;

    let cumulativePercentage = 0;
    
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map(item => {
        const percentage = item.value / total;
        const [startX, startY] = getCoordinatesForPercent(cumulativePercentage);
        cumulativePercentage += percentage;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercentage);
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
                        <span className="text-gray-300">{item.label}:</span>
                        <span className="font-semibold ml-auto pl-4 text-white">{(item.value / total * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};