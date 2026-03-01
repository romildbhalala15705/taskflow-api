import React from 'react';
import { Task } from '../types';

interface ViewerTaskItemProps {
    task: Task;
    isSubtask: boolean;
}

export const ViewerTaskItem: React.FC<ViewerTaskItemProps> = ({
    task,
    isSubtask,
}) => {
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

    const indicator = isSubtask ? "      └   " : "";

    const viewerCardStyle: React.CSSProperties = {
        position: 'relative',
        padding: '16px 12px', // Larger padding for view mode
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        fontWeight: getFontWeight(),
        cursor: 'pointer',
        borderBottom: '1px solid var(--c-border)',
        borderLeft: !isSubtask ? `4px solid ${STAGE_COLORS[task.stage as keyof typeof STAGE_COLORS]}` : '4px solid transparent',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'pre',
    };

    return (
        <div
            className="viewer-task-item task-card-fixed"
            style={viewerCardStyle}
            onClick={() => {
                // Expansion is disabled as subtasks are always visible
            }}
        >
            {indicator && (
                <span className="task-indicator-dynamic" style={{
                    fontFamily: 'monospace',
                    marginRight: '8px',
                    color: 'var(--c-text-secondary)',
                    opacity: 0.6,
                }}>{indicator}</span>
            )}
            <span className="task-title-dynamic">{task.name}</span>
        </div>
    );
};
