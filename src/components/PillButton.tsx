import React from 'react';

interface PillButtonProps {
    isOn: boolean;
    onToggle: () => void;
    text: string;
    styleOverride?: React.CSSProperties;
}

export const PillButton: React.FC<PillButtonProps> = ({ isOn, onToggle, text, styleOverride }) => {
    return (
        <button
            onClick={onToggle}
            className={`pill-btn ${isOn ? 'on' : 'off'}`}
            style={{
                backgroundColor: isOn ? 'var(--c-btn-on)' : 'var(--c-btn-off)',
                color: 'var(--c-btn-text)',
                border: 'none',
                borderRadius: '17px', // Height is 34px in WinForms (140, 34)
                padding: '0 20px',
                height: '34px',
                minWidth: '140px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                ...styleOverride
            }}
            onMouseEnter={(e) => {
                // Brighten logic
                e.currentTarget.style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
            }}
        >
            {text}
        </button>
    );
};
