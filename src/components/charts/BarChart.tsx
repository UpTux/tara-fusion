import React from 'react';

interface BarChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    const chartHeight = 250;
    const barGap = 10;
    const barWidth = 40;
    const chartWidth = data.length * (barWidth + barGap);
    const maxDataValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} aria-label="Bar chart" role="img">
            <g>
                {data.map((item, index) => {
                    const barHeight = (item.value / maxDataValue) * (chartHeight - 30); // 30px for labels
                    const x = index * (barWidth + barGap);
                    const y = chartHeight - barHeight - 20; // 20px for bottom label

                    return (
                        <g key={item.label} className="bar-group">
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                className={`${item.color} transition-all duration-300`}
                            />
                            <text
                                x={x + barWidth / 2}
                                y={y - 5}
                                textAnchor="middle"
                                className="fill-white font-bold text-sm"
                            >
                                {item.value}
                            </text>
                            <text
                                x={x + barWidth / 2}
                                y={chartHeight}
                                textAnchor="middle"
                                className="fill-gray-400 text-xs"
                            >
                                {item.label}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
