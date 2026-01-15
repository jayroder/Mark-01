import type { Node, NodeId } from '../types';

export const NODE_HEIGHT = 40; // Approx height for calculation
export const NODE_GAP_X = 200; // Horizontal space
export const NODE_GAP_Y = 10;  // Vertical space between siblings

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
        // Use actual height if available, otherwise fallback
        const nodeHeight = node.height || NODE_HEIGHT;

        if (!node || !node.isExpanded || node.children.length === 0) {
            sizes[id] = nodeHeight;
            return nodeHeight;
        }

        // Sum of children heights + gaps
        const childrenHeight = node.children.reduce((acc, childId) => {
            return acc + computeSize(childId);
        }, 0);

        // Add gaps between children
        const gaps = (node.children.length - 1) * NODE_GAP_Y;

        // The subtree size is the max of the node's own height and its children's total height
        sizes[id] = Math.max(nodeHeight, childrenHeight + gaps);
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

        // However, we need to center the children block relative to the parent?
        // In this logic, 'y' is the center of the current node's slot.
        // 'currentSize' is the full height of the subtree rooted here.
        // So (y - currentSize/2) is the top edge of this subtree's allocated space.

        // IMPORTANT: We need to center the children relative to the parent node.
        // The parent node is at 'y'. 
        // The children total height is 'childrenTotalHeight'.
        // So children should start at y - childrenTotalHeight / 2.

        // Re-calculate pure children height for positioning
        const childrenTotalHeight = node.children.reduce((acc, childId) => acc + sizes[childId], 0) +
            (node.children.length - 1) * NODE_GAP_Y;

        let startY = y - childrenTotalHeight / 2;

        node.children.forEach((childId) => {
            const childSize = sizes[childId];
            // Center the child in its allocated height
            const childY = startY + childSize / 2;

            assignCoordinates(childId, x + NODE_GAP_X, childY);

            startY += childSize + NODE_GAP_Y;
        });
    };

    // Start root at 0,0
    assignCoordinates(rootId, 0, 0);

    return newNodes;
};
