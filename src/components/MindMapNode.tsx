import React, { useRef, useEffect, useLayoutEffect } from 'react';
import type { Node } from '../types';
import { cn } from '../utils/cn';
import { useMindMapStore } from '../store/useMindMapStore';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface MindMapNodeProps {
    node: Node;
}

export const MindMapNode: React.FC<MindMapNodeProps> = ({ node }) => {
    const {
        selectedId,
        editingId,
        selectNode,
        updateNodeText,
        setEditingNode,
        addNode,
    } = useMindMapStore();

    const isSelected = selectedId === node.id;
    const isEditing = editingId === node.id;
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const nodeRef = useRef<HTMLDivElement>(null);

    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: node.id,
        disabled: isEditing,
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: node.id,
    });

    const setCombinedRef = (el: HTMLDivElement | null) => {
        setDragRef(el);
        setDropRef(el);
        (nodeRef as any).current = el;
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
            adjustHeight();
        }
    }, [isEditing]);

    // Redundant check to ensure size is captured on text change/mount
    useLayoutEffect(() => {
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            useMindMapStore.getState().updateNodeSize(node.id, rect.width, rect.height);
        }
    }, [node.text, node.isExpanded]);

    useEffect(() => {
        if (!nodeRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const rect = entry.target.getBoundingClientRect();
                useMindMapStore.getState().updateNodeSize(node.id, rect.width, rect.height);
            }
        });

        observer.observe(nodeRef.current);
        return () => observer.disconnect();
    }, [node.id]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectNode(node.id);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNode(node.id);
    };

    const handleBlur = () => {
        if (isEditing) {
            setEditingNode(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setEditingNode(null);
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            setEditingNode(null); // Commit change
            // Defer addition slightly to allow state update or directly call
            // Since zustand is synchronous(ish), this should work.
            // 1. Commit current text (auto via blur/setEditingNode logic? no, setEditingNode triggers re-render)
            // updateNodeText is called on Change, so store has latest text.

            // 2. Add Child
            addNode(node.id);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeText(node.id, e.target.value);
        adjustHeight();
    };

    const adjustHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: node.x,
        top: node.y,
        transform: transform ? CSS.Translate.toString(transform) + ' translate(-50%, -50%)' : 'translate(-50%, -50%)',
        zIndex: isDragging ? 50 : (isSelected ? 40 : 10),
        maxWidth: 600,
    };

    return (
        <div
            ref={setCombinedRef}
            // role="button" // Removed to avoid conflict with dnd-kit attributes
            {...listeners}
            {...attributes}
            className={cn(
                "flex items-center justify-center p-3 py-1.5 rounded-lg border-2 transition-colors duration-200 cursor-pointer shadow-sm touch-none",
                "min-w-[250px] max-w-[600px]",
                node.parentId === null
                    ? "bg-primary text-primary-foreground border-primary text-center font-bold text-lg rounded-xl shadow-lg"
                    : "bg-white text-gray-800 border-gray-200 hover:border-blue-300",
                isSelected && !isEditing && "border-blue-500 ring-2 ring-blue-200 shadow-md",
                isEditing && "border-blue-500 ring-2 ring-blue-200 bg-white z-50",
                isOver && !isDragging && "ring-4 ring-green-400 border-green-500",
                isDragging && "opacity-80 scale-105 shadow-xl"
            )}
            style={style}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    value={node.text}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "w-full bg-transparent outline-none resize-none overflow-hidden",
                        node.parentId === null ? "text-center text-primary-foreground" : "text-left text-gray-800"
                    )}
                    rows={1}
                />
            ) : (
                <span className="whitespace-pre-wrap break-all min-w-0 w-full pointer-events-none select-none">
                    {node.text}
                </span>
            )}
        </div>
    );
};
