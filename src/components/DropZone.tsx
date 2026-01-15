import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../utils/cn';
import type { NodeId } from '../types';

interface DropZoneProps {
    parentId: NodeId;
    index: number;
    y: number;
    x: number;
    active?: boolean;
}

// A thin line that expands when hovered
export const DropZone: React.FC<DropZoneProps> = ({ parentId, index, x, y }) => {
    // Unique ID encoding the action
    const id = `DROP_SIB|${parentId}|${index}`;

    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { type: 'sibling', parentId, index }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "absolute h-6 w-40 -translate-x-1/2 rounded transition-all pointer-events-auto z-10",
                // When dragging over, show a clear Line indicator
                isOver ? "bg-green-500 scale-y-50 opacity-100 shadow-xl ring-2 ring-green-300" : "bg-transparent opacity-0"
            )}
            style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
};
