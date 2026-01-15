import type { Node, NodeId } from '../types';

export const NODE_HEIGHT = 40; // Approx height for calculation
export const NODE_GAP_X = 200; // Horizontal space
export const NODE_GAP_Y = 20;  // Vertical space between siblings

// Simple recursive layout:
// 1. Calculate subtree height for every node.
// 2. Position nodes.

export const calculateLayout = (
    rootId: NodeId,
    nodes: Record<NodeId, Node>
): Record<NodeId, Node> => {
    const newNodes = { ...nodes };

    // 1. Compute heights
    const sizes: Record<NodeId, number> = {};

    const computeSize = (id: NodeId): number => {
        const node = newNodes[id];
        if (!node || !node.isExpanded || node.children.length === 0) {
            sizes[id] = NODE_HEIGHT;
            return NODE_HEIGHT;
        }

        // Sum of children heights + gaps
        const childrenHeight = node.children.reduce((acc, childId) => {
            return acc + computeSize(childId);
        }, 0);

        // Add gaps between children
        const gaps = (node.children.length - 1) * NODE_GAP_Y;

        sizes[id] = Math.max(NODE_HEIGHT, childrenHeight + gaps);
        return sizes[id];
    };

    computeSize(rootId);

    // 2. Assign coordinates (Second Pass)
    const assignCoordinates = (id: NodeId, x: number, y: number) => {
        const node = newNodes[id];
        if (!node) return;

        newNodes[id] = { ...node, x, y };

        if (!node.isExpanded || node.children.length === 0) return;

        const currentSize = sizes[id];
        let childYOffset = y - currentSize / 2; // Start from top of the subtree area

        node.children.forEach((childId) => {
            const childSize = sizes[childId];
            // Center the child in its allocated height
            const childY = childYOffset + childSize / 2;

            assignCoordinates(childId, x + NODE_GAP_X, childY);

            childYOffset += childSize + NODE_GAP_Y;
        });
    };

    // Start root at 0,0
    assignCoordinates(rootId, 0, 0);

    return newNodes;
};
