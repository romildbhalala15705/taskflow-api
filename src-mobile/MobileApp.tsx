import { useState } from 'react';
import { MobileBoard } from './MobileBoard';
import { useTasks } from '../src/useTasks';

export function MobileApp() {
    const [viewMode] = useState(false);
    const tasksApi = useTasks();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            width: '100vw',
            backgroundColor: 'var(--c-bg)',
            color: 'var(--c-title)',
            overflow: 'hidden',
            overscrollBehavior: 'none' // Prevent iOS bounce
        }}>
            <MobileBoard api={tasksApi} readOnly={viewMode} />
        </div>
    );
}
