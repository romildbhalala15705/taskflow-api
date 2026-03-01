import React from 'react';

export const ReadOnlyBadge: React.FC = () => {
    return (
        <div
            style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#D97706',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '14px',
                height: '28px',
                padding: '0 12px',
                fontWeight: '600',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
            }}
        >
            🔒 READ ONLY
        </div>
    );
};
