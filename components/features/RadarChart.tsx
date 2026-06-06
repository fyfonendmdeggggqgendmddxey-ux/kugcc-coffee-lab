import React from 'react';

const RadarChart = ({ 
    acidity = 3, 
    sweetness = 3, 
    body = 3, 
    bitterness = 3, 
    aroma = 3,
    compareAcidity,
    compareSweetness,
    compareBody,
    compareBitterness,
    compareAroma,
    size = 120
}: {
    acidity?: number;
    sweetness?: number;
    body?: number;
    bitterness?: number;
    aroma?: number;
    compareAcidity?: number;
    compareSweetness?: number;
    compareBody?: number;
    compareBitterness?: number;
    compareAroma?: number;
    size?: number;
}) => {
    const center = 50;
    const maxRadius = 40;
    
    // Parameters order matching coordinates
    const props1 = [acidity, sweetness, body, bitterness, aroma];
    const hasCompare = compareAcidity !== undefined && compareSweetness !== undefined && compareBody !== undefined && compareBitterness !== undefined && compareAroma !== undefined;
    const props2 = hasCompare ? [compareAcidity, compareSweetness, compareBody, compareBitterness, compareAroma] : null;
    const labels = ["酸味", "甘味", "コク", "苦味", "香り"];
    
    // Coordinates generator (Starting from -90 deg for acidity)
    const getCoordinates = (index: number, value: number) => {
        const angle = (Math.PI * 2 / 5) * index - Math.PI / 2;
        const radius = (value / 5) * maxRadius;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return { x, y };
    };

    // Concentric pentagons guidelines
    const gridLevels = [1, 2, 3, 4, 5];
    const gridPolygons = gridLevels.map(level => {
        const points = [];
        for (let i = 0; i < 5; i++) {
            const { x, y } = getCoordinates(i, level);
            points.push(`${x},${y}`);
        }
        return points.join(" ");
    });

    // Outer limit endpoints for axis lines
    const dataPoints1 = props1.map((val, idx) => {
        const { x, y } = getCoordinates(idx, val);
        return `${x},${y}`;
    }).join(" ");

    const dataPoints2 = props2 ? props2.map((val, idx) => {
        const { x, y } = getCoordinates(idx, val);
        return `${x},${y}`;
    }).join(" ") : null;

    // Label coordinates
    const labelDistance = 47; 
    const labelPoints = labels.map((label, idx) => {
        const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
        const x = center + labelDistance * Math.cos(angle);
        const y = center + labelDistance * Math.sin(angle);
        return { label, x, y };
    });

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible select-none text-white dark:text-white">
            <style>
                {`
                    @media (prefers-color-scheme: light) {
                        .radar-svg { color: #000; }
                    }
                    @media (prefers-color-scheme: dark) {
                        .radar-svg { color: #fff; }
                    }
                `}
            </style>
            <g className="radar-svg" style={{ color: 'inherit' }}>
                {gridPolygons.map((points, idx) => (
                    <polygon
                        key={idx}
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                        strokeWidth="0.5"
                    />
                ))}
                {[0, 1, 2, 3, 4].map(i => {
                    const outer = getCoordinates(i, 5);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="currentColor"
                            strokeOpacity="0.2"
                            strokeWidth="0.5"
                        />
                    );
                })}
                
                {dataPoints2 && (
                    <polygon
                        points={dataPoints2}
                        fill="#3b82f6"
                        fillOpacity="0.4"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                        className="transition-all duration-300"
                    />
                )}
                
                <polygon
                    points={dataPoints1}
                    fill={hasCompare ? "#f97316" : "currentColor"}
                    fillOpacity={hasCompare ? "0.4" : "0.2"}
                    stroke={hasCompare ? "#fb923c" : "currentColor"}
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                />

                {labelPoints.map((lp, idx) => (
                    <text
                        key={idx}
                        x={lp.x}
                        y={lp.y}
                        fill="currentColor"
                        fillOpacity="0.6"
                        fontSize="5"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {lp.label}
                    </text>
                ))}
            </g>
        </svg>
    );
};

export default RadarChart;
