import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export const useMindMapInteraction = () => {
    const {
        nodes,
        selectedId,
        editingId,
        rootId,
        addNode,
        deleteNode,
        selectNode,
        setEditingNode,
    } = useMindMapStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if editing text (MindMapNode handles generic keys, but we check global state too)
            if (editingId) return;

            switch (e.key) {
                case 'Tab': {
                    e.preventDefault(); // Prevent focus switch
                    if (selectedId) {
                        addNode(selectedId);
                        // new node is auto-selected/edited by store logic
                    }
                    break;
                }
                case 'Enter': {
                    e.preventDefault();
                    if (selectedId) {
                        if (selectedId === rootId) {
                            // Root Enter -> Add Child (same as Tab)
                            addNode(selectedId);
                        } else {
                            // Add Sibling
                            const node = nodes[selectedId];
                            if (node && node.parentId) {
                                addNode(node.parentId);
                            }
                        }
                    }
                    break;
                }
                case 'Backspace':
                case 'Delete': {
                    if (selectedId) {
                        deleteNode(selectedId);
                    }
                    break;
                }
                case 'ArrowRight': {
                    e.preventDefault();
                    if (selectedId) navigate('right');
                    break;
                }
                case 'ArrowLeft': {
                    e.preventDefault();
                    if (selectedId) navigate('left');
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    if (selectedId) navigate('up');
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    if (selectedId) navigate('down');
                    break;
                }
                case ' ': // Space
                case 'F2': {
                    if (selectedId) {
                        e.preventDefault();
                        setEditingNode(selectedId);
                    }
                    break;
                }
            }
        };

        const navigate = (direction: 'left' | 'right' | 'up' | 'down') => {
            if (!selectedId) return;
            const current = nodes[selectedId];
            if (!current) return;

            if (direction === 'left') {
                if (current.parentId) {
                    selectNode(current.parentId);
                }
            } else if (direction === 'right') {
                if (current.children.length > 0) {
                    // Select first child or middle child?
                    // Visual middle is better.
                    const mid = Math.floor(current.children.length / 2);
                    selectNode(current.children[mid]);
                }
            } else if (direction === 'up' || direction === 'down') {
                // Find sibling
                if (!current.parentId) return;
                const parent = nodes[current.parentId];
                const idx = parent.children.indexOf(selectedId);
                if (idx === -1) return;

                if (direction === 'up' && idx > 0) {
                    selectNode(parent.children[idx - 1]);
                } else if (direction === 'down' && idx < parent.children.length - 1) {
                    selectNode(parent.children[idx + 1]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, editingId, nodes, rootId, addNode, deleteNode, selectNode, setEditingNode]);
};
