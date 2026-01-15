import React from 'react';
import type { Node } from '../types';

interface ConnectionLayerProps {
    nodes: Record<string, Node>;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ nodes }) => {
    return (
        <svg className="absolute left-0 top-0 w-1 h-1 pointer-events-none overflow-visible -z-10">
            {Object.values(nodes).map((node) => {
                if (!node.parentId) return null;
                const parent = nodes[node.parentId];
                if (!parent) return null;

                // Draw from center to center (hidden behind node bg)
                // Adjust control points for Horizontal Bezier
                // Node is roughly 150px wide (min). Half is 75px.
                // We offset start by +75 (right edge of parent) and end by -75 (left edge of child)
                // to minimize overlap with text.
                const offset = 70;
                const x1 = parent.x + offset;
                const y1 = parent.y;
                const x2 = node.x - offset;
                const y2 = node.y;

                // Control points: 
                // 50% of the distance horizontal
                const dist = Math.abs(x2 - x1);
                const cp1x = x1 + dist * 0.5;
                const cp2x = x2 - dist * 0.5;

                // Simple Bezier: M start C cp1, cp2, end
                const pathData = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

                return (
                    <path
                        key={`conn-${parent.id}-${node.id}`}
                        d={pathData}
                        fill="none"
                        stroke="#cbd5e1" // slate-300
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                );
            })}
        </svg>
    );
};
