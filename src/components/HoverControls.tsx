import React from 'react';

interface HoverControlsProps {
    moveNext: () => void;
    deleteTask: () => void;
    toggleUrgent: () => void;
    swapPosition: (dir: number) => void;
    showInlineAdd: () => void;
    onClose: () => void;

    // Optional visibility toggles
    showMoveNext?: boolean;
    showDelete?: boolean;
    showAddSubtask?: boolean;
    showUrgent?: boolean;
    showSwap?: boolean;
}

export const HoverControls: React.FC<HoverControlsProps> = ({
    moveNext,
    deleteTask,
    toggleUrgent,
    swapPosition,
    showInlineAdd,
    onClose,
    showMoveNext = true,
    showDelete = true,
    showAddSubtask = true,
    showUrgent = true,
    showSwap = true
}) => {

    return (
        <div
            onMouseLeave={onClose}
            style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '32px',
                backgroundColor: 'var(--c-card-bg)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                border: '1px solid var(--c-border)',
                overflow: 'hidden',
                padding: '0 4px',
                gap: '2px'
            }}
            onClick={(e) => e.stopPropagation()} // Stop row click
        >
            {showMoveNext && <button onClick={moveNext} title="Move Next" style={btnStyle}>✅</button>}
            {showDelete && <button onClick={deleteTask} title="Delete" style={btnStyle}>❌</button>}
            {showAddSubtask && <button onClick={showInlineAdd} title="Add Subtask" style={btnStyle}>➕</button>}
            {showUrgent && <button onClick={toggleUrgent} title="Toggle Urgent" style={btnStyle}>🔥</button>}
            {showSwap && (
                <>
                    <button onClick={() => swapPosition(-1)} title="Move Up" style={btnStyle}>⬆</button>
                    <button onClick={() => swapPosition(1)} title="Move Down" style={btnStyle}>⬇</button>
                </>
            )}
        </div>
    );
};

const btnStyle: React.CSSProperties = {
    width: '28px',
    height: '24px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
};
