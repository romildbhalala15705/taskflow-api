import React, { useState, useEffect } from 'react';
import { Task, STAGES, Stage } from '../types';
import { TaskItem } from './TaskItem';
import { ViewerTaskItem } from './ViewerTaskItem';
// Interfaces for Board dependencies
export interface BoardAPI {
    tasks: Task[];
    addTask: (name: string, stage: Stage, parentId?: string | null) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    swapPosition: (t: Task, dir: number) => void;
    moveNext: (t: Task) => void;
    moveTaskStage: (task: Task, newStage: Stage) => void;
}

interface BoardProps {
    api: BoardAPI;
    readOnly: boolean;
}

const HEADINGS = {
    'Site Visit': 'Site Visit',
    'Quotation': 'Quotation',
    'Design': 'Design',
    'CNC': 'CNC',
    'Completed': 'Completed'
};

const STAGE_COLORS = {
    'Site Visit': 'var(--c-stage-site)',
    'Quotation': 'var(--c-stage-quote)',
    'Design': 'var(--c-stage-design)',
    'CNC': 'var(--c-stage-cnc)',
    'Completed': 'var(--c-stage-comp)'
};

const STAGE_BGS = {
    'Site Visit': 'var(--c-stage-site-bg)',
    'Quotation': 'var(--c-stage-quote-bg)',
    'Design': 'var(--c-stage-design-bg)',
    'CNC': 'var(--c-stage-cnc-bg)',
    'Completed': 'var(--c-stage-comp-bg)'
};

export const Board: React.FC<BoardProps> = ({ api, readOnly }) => {
    const [inlineAdd, setInlineAdd] = useState<{ parentId: string, stage: Stage, top: number, left: number } | null>(null);
    const [inlineAddText, setInlineAddText] = useState('');
    // Use collapsedIds so all tasks are expanded by default when empty
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('boardCollapsedIds');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        localStorage.setItem('boardCollapsedIds', JSON.stringify(Array.from(collapsedIds)));
    }, [collapsedIds]);

    const handleShowInlineAdd = (task: Task, ref: HTMLElement) => {
        if (readOnly) return;
        const rect = ref.getBoundingClientRect();
        setInlineAdd({
            parentId: task._id,
            stage: task.stage as Stage,
            top: rect.bottom, // Place right below the item
            left: rect.left + 40,
        });
        // Focus will be handled by autoFocus in the input
    };

    const handleInlineAddSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inlineAddText.trim()) {
            api.addTask(inlineAddText.trim(), inlineAdd!.stage, inlineAdd!.parentId);
            setCollapsedIds(prev => {
                const next = new Set(prev);
                next.delete(inlineAdd!.parentId);
                return next;
            });
            setInlineAdd(null);
            setInlineAddText('');
        } else if (e.key === 'Escape') {
            setInlineAdd(null);
            setInlineAddText('');
        }
    };

    const renderColumn = (stage: Stage) => {
        const stageTasks = api.tasks.filter(t => t.stage === stage);
        const mainTasks = stageTasks.filter(t => !t.parent).sort((a, b) => a.position - b.position);

        // List view styles logic
        const listViewerStyle: React.CSSProperties = {
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '6px', // for scrollbar offset
            paddingLeft: readOnly ? '4px' : '0px', // padding only in view mode
            paddingBottom: readOnly ? '20px' : '0px' // breathing room only in view mode
        };

        const accentColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS];
        const accentBg = STAGE_BGS[stage as keyof typeof STAGE_BGS];

        return (
            <div key={stage} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: 'var(--c-column-bg)',
                borderRadius: '12px',
                border: '1px solid var(--c-border)',
                flex: readOnly ? '1 1 50%' : 1, // Fix to 50% in view mode
                minWidth: readOnly ? '0px' : '280px', // Allow 50% split without overflow in view mode
                marginRight: '12px',
                overflow: 'hidden'
            }}
                onDragOver={(e) => !readOnly && e.preventDefault()}
                onDrop={(e) => {
                    if (readOnly) return;
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('taskId');
                    if (taskId) {
                        const task = api.tasks.find(t => t._id === taskId);
                        if (task && task.stage !== stage) {
                            api.moveTaskStage(task, stage);
                        }
                    }
                }}>
                {/* Title */}
                {readOnly ? (
                    <div style={{
                        position: 'sticky', top: 0, zIndex: 2, padding: '20px 24px', fontSize: '24px', fontWeight: 600,
                        color: accentColor, backgroundColor: accentBg, borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: accentColor }}></div>
                            {HEADINGS[stage as keyof typeof HEADINGS]}
                        </div>
                        <div style={{ fontSize: '18px', color: 'var(--c-text-secondary)', backgroundColor: 'rgba(255,255,255,0.5)', padding: '4px 12px', borderRadius: '12px', fontWeight: 500 }}>
                            {mainTasks.length}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        position: 'sticky', top: 0, zIndex: 2, padding: '12px 16px', fontSize: '14px', fontWeight: 600,
                        color: accentColor, backgroundColor: accentBg, borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accentColor }}></div>
                            {HEADINGS[stage as keyof typeof HEADINGS]}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--c-text-secondary)', backgroundColor: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                            {mainTasks.length}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {/* List View equivalent */}
                    <div style={listViewerStyle}>
                        {mainTasks.map(main => (
                            <React.Fragment key={main._id}>
                                {readOnly ? (
                                    <ViewerTaskItem
                                        task={main}
                                        isSubtask={false}
                                    />
                                ) : (
                                    <TaskItem
                                        task={main}
                                        isSubtask={false}
                                        readOnly={readOnly}
                                        deleteTask={api.deleteTask}
                                        moveNext={api.moveNext}
                                        updateTask={api.updateTask}
                                        swapPosition={api.swapPosition}
                                        onShowInlineAdd={handleShowInlineAdd}
                                    />
                                )}
                                {/* Subtasks are permanently rendered for this main task */}
                                {stageTasks
                                    .filter(s => s.parent === main._id)
                                    .sort((a, b) => a.position - b.position)
                                    .map(sub => (
                                        readOnly ? (
                                            <ViewerTaskItem
                                                key={sub._id}
                                                task={sub}
                                                isSubtask={true}
                                            />
                                        ) : (
                                            <TaskItem
                                                key={sub._id}
                                                task={sub}
                                                isSubtask={true}
                                                readOnly={readOnly}
                                                deleteTask={api.deleteTask}
                                                moveNext={api.moveNext}
                                                updateTask={api.updateTask}
                                                swapPosition={api.swapPosition}
                                                onShowInlineAdd={handleShowInlineAdd}
                                            />
                                        )
                                    ))}
                            </React.Fragment>
                        ))}

                        {/* Click elsewhere to close inline add */}
                        <div style={{ minHeight: '80px', flex: 1 }} onClick={() => setInlineAdd(null)} />
                    </div>

                    {/* Bottom Input Area for Editors */}
                    {!readOnly && (
                        <div style={{ borderTop: '1px solid var(--c-border)', backgroundColor: 'var(--c-card-hover)', padding: '8px' }}>
                            <div style={{ height: '36px', display: 'flex' }}>
                                <input
                                    type="text"
                                    className="input-dashed"
                                    style={{ flex: 1, fontSize: '14px', padding: '0 12px', width: '100%', color: 'var(--c-title)' }}
                                    placeholder="+ Add new task..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            api.addTask(e.currentTarget.value.trim(), stage);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Filter STAGES based on readOnly mode: if view mode, only show Design and CNC
    const visibleStages = readOnly
        ? STAGES.filter(s => s === 'Design' || s === 'CNC')
        : STAGES;

    return (
        <div className="hide-scrollbar" style={{ display: 'flex', width: '100%', height: '100%', overflowX: 'auto', padding: '4px' }}>
            {visibleStages.map((stage, index) => (
                <React.Fragment key={stage}>
                    {renderColumn(stage)}
                    {/* Resizer Handle - Hidden in readOnly Mode */}
                    {index < visibleStages.length - 1 && !readOnly && (
                        <div
                            style={{
                                width: '4px',
                                cursor: 'col-resize',
                                backgroundColor: 'transparent',
                                zIndex: 10,
                                marginRight: '8px'
                            }}
                            onMouseDown={(e) => {
                                const startX = e.clientX;
                                const column = e.currentTarget.previousElementSibling as HTMLElement;
                                const startWidth = column.getBoundingClientRect().width;

                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    const newWidth = startWidth + (moveEvent.clientX - startX);
                                    column.style.flex = `0 0 ${newWidth}px`;
                                };

                                const onMouseUp = () => {
                                    document.removeEventListener('mousemove', onMouseMove);
                                    document.removeEventListener('mouseup', onMouseUp);
                                };

                                document.addEventListener('mousemove', onMouseMove);
                                document.addEventListener('mouseup', onMouseUp);
                            }}
                        />
                    )}
                </React.Fragment>
            ))}

            {/* Floating Inline Add TextBox */}
            {inlineAdd && !readOnly && (
                <input
                    autoFocus
                    style={{
                        position: 'fixed',
                        top: inlineAdd.top,
                        left: inlineAdd.left,
                        width: '200px',
                        fontSize: '14px',
                        padding: '4px',
                        zIndex: 1100,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        border: '2px solid var(--c-btn-on)'
                    }}
                    value={inlineAddText}
                    onChange={e => setInlineAddText(e.target.value)}
                    onKeyDown={handleInlineAddSubmit}
                    onBlur={() => { setInlineAdd(null); setInlineAddText(''); }}
                />
            )}
        </div>
    );
};
