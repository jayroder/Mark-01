import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MindMapState, Node } from '../types';

const initialRootId = 'root';
const initialNodes: Record<string, Node> = {
    [initialRootId]: {
        id: initialRootId,
        parentId: null,
        text: 'Central Topic',
        children: [],
        isExpanded: true,
        x: 0,
        y: 0,
    },
};

export const useMindMapStore = create<MindMapState>((set) => ({
    nodes: initialNodes,
    rootId: initialRootId,
    selectedId: null,
    editingId: null,

    addNode: (parentId, text = 'New Node') => {
        const newId = uuidv4();
        set((state) => {
            const parent = state.nodes[parentId];
            if (!parent) return state;

            const newNode: Node = {
                id: newId,
                parentId,
                text,
                children: [],
                isExpanded: true,
                x: 0,
                y: 0,
            };

            return {
                nodes: {
                    ...state.nodes,
                    [newId]: newNode,
                    [parentId]: {
                        ...parent,
                        children: [...parent.children, newId],
                        isExpanded: true,
                    },
                },
                selectedId: newId,
                editingId: newId,
            };
        });
    },

    deleteNode: (id) => {
        set((state) => {
            if (id === state.rootId) return state;

            const nodeToDelete = state.nodes[id];
            if (!nodeToDelete) return state;

            const parentId = nodeToDelete.parentId;
            if (!parentId) return state;

            const idsToDelete = new Set<string>();
            const collectIds = (nodeId: string) => {
                idsToDelete.add(nodeId);
                const node = state.nodes[nodeId];
                if (node) {
                    node.children.forEach(collectIds);
                }
            };
            collectIds(id);

            const parent = state.nodes[parentId];
            const newParentChildren = parent.children.filter((childId) => childId !== id);

            const newNodes = { ...state.nodes };
            idsToDelete.forEach((deletedId) => {
                delete newNodes[deletedId];
            });
            newNodes[parentId] = { ...parent, children: newParentChildren };

            return {
                nodes: newNodes,
                selectedId: parentId,
            };
        });
    },

    updateNodeText: (id, text) => {
        set((state) => ({
            nodes: {
                ...state.nodes,
                [id]: { ...state.nodes[id], text },
            },
        }));
    },

    selectNode: (id) => set({ selectedId: id, editingId: null }),

    setEditingNode: (id) => set({ editingId: id }),

    moveNode: (draggedId, targetId, position, index) => {
        set((state) => {
            if (draggedId === targetId || draggedId === state.rootId) return state;

            const draggedNode = state.nodes[draggedId];
            // Note: If position='sibling', targetId is actually the Parent ID.
            // If position='child', targetId is the new Parent ID.
            const newParentId = targetId;

            const newParentNode = state.nodes[newParentId];
            if (!draggedNode || !newParentNode) return state;

            let current = newParentNode;
            while (current.parentId) {
                if (current.parentId === draggedId) return state;
                if (current.id === draggedId) return state;
                current = state.nodes[current.parentId];
            }
            if (current.id === draggedId) return state;

            const newNodes = { ...state.nodes };

            if (draggedNode.parentId) {
                const oldParent = newNodes[draggedNode.parentId];
                newNodes[draggedNode.parentId] = {
                    ...oldParent,
                    children: oldParent.children.filter(id => id !== draggedId)
                };
            }

            const newParent = newNodes[newParentId];
            const newChildren = [...newParent.children];

            if (position === 'child') {
                newChildren.push(draggedId);
            } else {
                // Sibling insert
                // Adjust index if we removed from same parent and it shifted
                if (typeof index === 'number') {
                    let insertIndex = index;
                    if (draggedNode.parentId === newParentId) {
                        // We need to compare against ORIGINAL index to see if shift happened.
                        // But we already filtered it out from newNodes. 
                        // We can rely on state.nodes before mutation?
                        // Simpler: The filtered list 'newParent.children' (calculated above) 
                        // logic in previous block actually used 'oldParent' which is 'newNodes[...]'.
                        // Wait, inside the 'if (dragged.parentId)' block we modified newNodes.
                        // So 'newParent' (read now) has the item removed if it was the same parent.

                        // If item was at index 0, and we insert at index 2.
                        // Old: [A, B, C]. Target: After B (Index 2).
                        // New (after remove): [B, C].
                        // Insert at 2 -> [B, C, A]. Correct. (Index 2 is 3rd slot).

                        // If item was at index 0. Insert at index 0.
                        // Old: [A, B, C].
                        // New: [B, C].
                        // Insert at 0 -> [A, B, C]. Correct.

                        // If item was at index 0. Insert at index 1 (After A?)
                        // DropZone index 1 is "Between A and B".
                        // If we drag A to its own "after" slot?
                        // DropZone loop: index 0 (Above A), index 1 (Below A).
                        // If we drop at index 1.
                        // Old: [A, B, C]. Remove A -> [B, C].
                        // Insert at 1 -> [B, A, C]. Correct?
                        // No. A was at 0. dropping below A means A should stay at 0 technically?
                        // Actually if we move A below A, no change.
                        // But DropZone 1 is between A and B. So A becomes 2nd. B becomes 1st.
                        // So [B, A, C] IS correct change.

                        // Wait. Original: 0=A, 1=B.
                        // DropZone 1 is AFTER A.
                        // So we want A to be AFTER A? No, we want A to be AFTER A implies position 1? 
                        // If list is A, B. Index 0 is before A. Index 1 is A..B. Index 2 is after B.
                        // If we drop A at Index 1. 
                        // Remove A -> [B].
                        // Insert at 1 -> [B, A].
                        // Effectively swapped. Correct.

                        // However, there is one edge case.
                        // If drag A (index 0) to Index 1 (After A).
                        // List: [A, B]. Remove A -> [B].
                        // Insert at 1 -> [B, A]. Swapped. 
                        // But visually we dropped "After A".
                        // This implies we want it to be... well, After A.
                        // If we drop "Below A", it puts it between A and B.
                        // So A moves down. Yes.

                        // What if we drop "Above A" (Index 0).
                        // List: [A, B]. Remove A -> [B].
                        // Insert at 0 -> [A, B]. No change. Correct.

                        // So logic seems fine without manual adjustment IF 'index' corresponds to "Gap Index".
                        // Gap 0 = Start. Gap N = End.
                        // If we remove item, the array shrinks.
                        // If we drop at Gap > OldItemIndex, the Gap index in the NEW array needs to shift?
                        // Example: [A, B, C]. 
                        // A is index 0.
                        // Gaps: 0 (Pre-A), 1 (Post-A/Pre-B), 2 (Post-B/Pre-C), 3 (Post-C).
                        // Drag A to Gap 2 (Between B and C).
                        // Remove A -> [B, C].
                        // Insert at 2 -> [B, C, A].
                        // Result: A moved to end.
                        // Original intent: Between B and C.
                        // Should be [B, A, C].
                        // So yes, if OldIndex < Index, we must decrement Index.
                        // Because the "Gap 2" was calculated including A. 
                        // Once A is gone, Gap 2 is now the end of the array (after C).
                        // But we wanted "After B". Which is now index 1.

                        const originalChildren = state.nodes[newParentId].children;
                        const oldIndex = originalChildren.indexOf(draggedId);
                        if (oldIndex !== -1 && oldIndex < insertIndex) {
                            insertIndex--;
                        }
                    }
                    newChildren.splice(insertIndex, 0, draggedId);
                } else {
                    newChildren.push(draggedId);
                }
            }

            newNodes[newParentId] = {
                ...newParent,
                children: newChildren,
                isExpanded: true
            };

            newNodes[draggedId] = { ...draggedNode, parentId: newParentId };

            return { nodes: newNodes };
        });
    },

    updateNodeSize: (id, width, height) => {
        set((state) => {
            const node = state.nodes[id];
            if (node && (node.width !== width || node.height !== height)) {
                return {
                    nodes: {
                        ...state.nodes,
                        [id]: { ...node, width, height },
                    },
                };
            }
            return state;
        });
    },
}));
