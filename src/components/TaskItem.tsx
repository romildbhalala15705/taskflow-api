import React, { useState } from 'react';
import { Task } from '../types';
import { HoverControls } from './HoverControls';
import { GripVertical } from 'lucide-react';
// import { HoverControls } from './HoverControls';

interface TaskItemProps {
    task: Task;
    isSubtask: boolean;
    readOnly: boolean;
    // Methods passed down from board
    moveNext: (t: Task) => void;
    deleteTask: (id: string) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    swapPosition: (t: Task, dir: number) => void;
    onShowInlineAdd?: (t: Task, element: HTMLElement) => void;
    hoverPermissions?: {
        showMoveNext?: boolean;
        showDelete?: boolean;
        showAddSubtask?: boolean;
        showUrgent?: boolean;
        showSwap?: boolean;
    };
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    isSubtask,
    readOnly,
    moveNext,
    deleteTask,
    updateTask,
    swapPosition,
    onShowInlineAdd,
    hoverPermissions
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragHandleHovered, setIsDragHandleHovered] = useState(false);
    const [ref, setRef] = useState<HTMLDivElement | null>(null);

    const STAGE_COLORS = {
        'Site Visit': 'var(--c-stage-site)',
        'Quotation': 'var(--c-stage-quote)',
        'Design': 'var(--c-stage-design)',
        'CNC': 'var(--c-stage-cnc)',
        'Completed': 'var(--c-stage-comp)'
    };

    const getBackgroundColor = () => {
        if (task.urgent) return 'var(--c-urgent-bg)';
        if (isSubtask) return 'var(--c-stage-bg)';
        return 'transparent';
    };

    const getTextColor = () => {
        if (task.urgent) return 'var(--c-urgent-text)';
        if (isSubtask) return 'var(--c-text-secondary)';
        return 'var(--c-title)';
    };

    const getFontWeight = () => task.urgent ? '600' : '500';

    const indicator = isSubtask ? "   └ " : "";

    return (
        <div
            ref={setRef}
            className={`task-item task-card-fixed ${isHovered && !readOnly ? 'hovered' : ''}`}
            onMouseEnter={() => !readOnly && setIsHovered(true)}
            onMouseLeave={() => !readOnly && setIsHovered(false)}
            draggable={isDragHandleHovered && !readOnly}
            onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task._id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => setIsDragHandleHovered(false)}
            style={{
                position: 'relative',
                padding: '8px 4px',
                backgroundColor: isHovered && !readOnly ? 'var(--c-card-hover)' : getBackgroundColor(),
                color: getTextColor(),
                fontWeight: getFontWeight(),
                cursor: 'pointer',
                borderBottom: '1px solid var(--c-border)',
                borderLeft: !isSubtask ? `4px solid ${STAGE_COLORS[task.stage as keyof typeof STAGE_COLORS]}` : '4px solid transparent',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'pre',
            }}
            onClick={() => {
                // Expansion is disabled as subtasks are always visible
            }}
        >
            {/* Desktop and Main Task Mobile Drag Handle */}
            {!readOnly && (!isSubtask) && (
                <div
                    className="drag-handle-main"
                    onMouseEnter={() => setIsDragHandleHovered(true)}
                    onMouseLeave={() => setIsDragHandleHovered(false)}
                    style={{ cursor: 'grab', marginRight: '4px', display: 'flex', alignItems: 'center' }}
                >
                    <GripVertical size={14} color="var(--c-text-secondary)" />
                </div>
            )}

            {/* Desktop Subtask Drag Handle (Hidden on Mobile) */}
            {!readOnly && isSubtask && (
                <div
                    className="drag-handle-sub-desktop"
                    onMouseEnter={() => setIsDragHandleHovered(true)}
                    onMouseLeave={() => setIsDragHandleHovered(false)}
                    style={{ cursor: 'grab', marginRight: '4px', display: 'flex', alignItems: 'center' }}
                >
                    <GripVertical size={14} color="var(--c-text-secondary)" />
                </div>
            )}

            {indicator && (
                <span className="task-indicator-dynamic" style={{
                    fontFamily: 'monospace',
                    marginRight: '8px',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                }}>{indicator}</span>
            )}
            <span className="task-title-dynamic">{task.name}</span>

            {/* Mobile Subtask Drag Handle (Hidden on Desktop, Pushed Right) */}
            {!readOnly && isSubtask && (
                <div
                    className="drag-handle-sub-mobile"
                    onMouseEnter={() => setIsDragHandleHovered(true)}
                    onMouseLeave={() => setIsDragHandleHovered(false)}
                    style={{ cursor: 'grab', marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                    <GripVertical size={14} color="var(--c-text-secondary)" />
                </div>
            )}

            {isHovered && !readOnly && ref && (
                <HoverControls
                    moveNext={() => moveNext(task)}
                    deleteTask={() => deleteTask(task._id)}
                    toggleUrgent={() => updateTask(task._id, { urgent: !task.urgent })}
                    swapPosition={(dir: number) => swapPosition(task, dir)}
                    showInlineAdd={() => onShowInlineAdd && onShowInlineAdd(task, ref)}
                    onClose={() => setIsHovered(false)}
                    {...(hoverPermissions || {})}
                />
            )}
        </div>
    );
};
