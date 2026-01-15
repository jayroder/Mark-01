import React, { useMemo } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { calculateLayout, NODE_GAP_Y } from '../utils/layout';
import { MindMapNode } from './MindMapNode';
import { ConnectionLayer } from './ConnectionLayer';
import { DropZone } from './DropZone';
import { useMindMapInteraction } from '../hooks/useMindMapInteraction';
import { DndContext, type DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { Node } from '../types';

export const MindMapCanvas: React.FC = () => {
    const { nodes, rootId, selectNode, moveNode } = useMindMapStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    useMindMapInteraction();

    const layoutNodes = useMemo(() => {
        return calculateLayout(rootId, nodes);
    }, [nodes, rootId]);

    // Group nodes by parent for DropZone rendering
    const siblingGroups = useMemo(() => {
        const groups: Record<string, Node[]> = {};
        Object.values(layoutNodes).forEach(node => {
            if (!node.parentId) return;
            if (!groups[node.parentId]) groups[node.parentId] = [];
            groups[node.parentId].push(node);
        });
        return groups;
    }, [layoutNodes]);

    const handleCanvasClick = () => {
        selectNode(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        // Check if dropping on a DropZone
        if (String(over.id).startsWith('DROP_SIB')) {
            const parts = String(over.id).split('|');
            // ID: DROP_SIB|parentId|index
            const targetParentId = parts[1];
            const index = parseInt(parts[2], 10);

            moveNode(active.id as string, targetParentId, 'sibling', index);
            return;
        }

        if (active.id !== over.id) {
            // Fallback: Reparent (Child)
            moveNode(active.id as string, over.id as string, 'child');
        }
    };

    // Render Logic:
    const renderDropZones = () => {
        const zones = [];

        for (const [parentId, children] of Object.entries(siblingGroups)) {
            // Sort children by Y just to be safe they match visual order
            const sortedChildren = [...children].sort((a, b) => a.y - b.y);

            sortedChildren.forEach((child, index) => {
                // Zone Before Child (index)
                let y = child.y - NODE_GAP_Y / 2;
                if (index > 0) {
                    const prev = sortedChildren[index - 1];
                    y = (prev.y + child.y) / 2;
                }

                zones.push(
                    <DropZone
                        key={`dz-${parentId}-${index}`}
                        parentId={parentId}
                        index={index}
                        x={child.x}
                        y={y}
                    />
                );
            });

            // Zone After Last Child
            if (sortedChildren.length > 0) {
                const last = sortedChildren[sortedChildren.length - 1];
                zones.push(
                    <DropZone
                        key={`dz-${parentId}-${sortedChildren.length}`}
                        parentId={parentId}
                        index={sortedChildren.length}
                        x={last.x}
                        y={last.y + NODE_GAP_Y / 2}
                    />
                );
            }
        }
        return zones;
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
                className="w-full h-full bg-slate-50 relative overflow-auto cursor-default touch-none"
                onClick={handleCanvasClick}
            >
                <div
                    className="absolute left-1/2 top-1/2 transition-transform duration-300 ease-out origin-center"
                    style={{ transform: 'translate(0, 0)' }}
                >
                    <ConnectionLayer nodes={layoutNodes} />
                    {renderDropZones()}
                    {Object.values(layoutNodes).map((node) => (
                        <MindMapNode key={node.id} node={node} />
                    ))}
                </div>

                <DragOverlay>
                </DragOverlay>

                <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded text-xs text-slate-500 pointer-events-none">
                    Tab: Add Child | Enter: Add Sibling | Arrows: Move | Space: Edit | Drag to Reparent/Reorder (Green Line)
                </div>
            </div>
        </DndContext>
    );
};
