export interface Node {
    id: string;
    parentId: string | null;
    text: string;
    children: string[];
    isExpanded: boolean;

    // Visual/Layout Properties
    x: number;
    y: number;
    width?: number; // Calculated after render or estimated
    height?: number;
}

export type NodeId = string;

export interface MindMapState {
    nodes: Record<NodeId, Node>;
    rootId: NodeId;
    selectedId: NodeId | null;
    editingId: NodeId | null; // The node currently being edited

    // Actions
    addNode: (parentId: NodeId, text?: string) => void;
    deleteNode: (id: NodeId) => void;
    updateNodeText: (id: NodeId, text: string) => void;
    selectNode: (id: NodeId | null) => void;
    setEditingNode: (id: NodeId | null) => void;
    moveNode: (draggedId: NodeId, targetId: NodeId, position: 'child' | 'sibling') => void;
}
