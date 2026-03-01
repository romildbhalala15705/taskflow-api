import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardAPI } from '../src/components/Board';
// We re-use TaskItem for actual rendering
import { TaskItem } from '../src/components/TaskItem';
import { ViewerTaskItem } from '../src/components/ViewerTaskItem';
import { STAGES, Stage } from '../src/types';

// Icons for navigation
import { MapPin, FileText, PenTool, Cpu, CheckCircle, Settings } from 'lucide-react';

interface MobileBoardProps {
    api: BoardAPI;
    readOnly: boolean;
}

const STAGE_ICONS = {
    'Site Visit': MapPin,
    'Quotation': FileText,
    'Design': PenTool,
    'CNC': Cpu,
    'Completed': CheckCircle,
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

const HEADINGS = {
    'Site Visit': 'Site Visit',
    'Quotation': 'Quotation',
    'Design': 'Design',
    'CNC': 'CNC',
    'Completed': 'Completed'
};

export const MobileBoard: React.FC<MobileBoardProps> = ({ api, readOnly }) => {
    const [enabledStages, setEnabledStages] = useState<Stage[]>(() => {
        const saved = localStorage.getItem('mobileEnabledStages');
        if (saved) return JSON.parse(saved);
        return STAGES;
    });

    const [hoverPermissions, setHoverPermissions] = useState({
        showMoveNext: true,
        showDelete: true,
        showAddSubtask: true,
        showUrgent: true,
        showSwap: true
    });

    // Load initial permissions from localStorage once
    React.useEffect(() => {
        const savedPerms = localStorage.getItem('mobileHoverPermissions');
        if (savedPerms) {
            setHoverPermissions(JSON.parse(savedPerms));
        }
    }, []);

    const togglePermission = (key: keyof typeof hoverPermissions) => {
        const newPerms = { ...hoverPermissions, [key]: !hoverPermissions[key] };
        setHoverPermissions(newPerms);
        localStorage.setItem('mobileHoverPermissions', JSON.stringify(newPerms));
    };

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordAttempt, setPasswordAttempt] = useState('');
    const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('mobileServerUrl') || '');

    const toggleStage = (stage: Stage) => {
        let newStages;
        if (enabledStages.includes(stage)) {
            newStages = enabledStages.filter(s => s !== stage);
        } else {
            // Add keeping original order
            newStages = STAGES.filter(s => enabledStages.includes(s) || s === stage);
        }
        if (newStages.length === 0) return; // Prevent hiding all stages
        setEnabledStages(newStages);
        localStorage.setItem('mobileEnabledStages', JSON.stringify(newStages));
    };

    const closeSettings = () => {
        setSettingsOpen(false);
        setIsAuthenticated(false);
        setPasswordAttempt('');
    };

    // Determine which stages to show based on readOnly
    const visibleStages = readOnly
        ? STAGES.filter(s => s === 'Design' || s === 'CNC')
        : STAGES.filter(s => enabledStages.includes(s));

    const [activeStageIndex, setActiveStageIndex] = useState(0);
    const validActiveIndex = Math.min(activeStageIndex, Math.max(0, visibleStages.length - 1));
    const activeStage = visibleStages[validActiveIndex] || STAGES[0];

    const handleDragEnd = (event: any, info: any) => {
        const threshold = 50;
        if (info.offset.x < -threshold && validActiveIndex < visibleStages.length - 1) {
            setActiveStageIndex(validActiveIndex + 1); // Swipe left = next stage
        } else if (info.offset.x > threshold && validActiveIndex > 0) {
            setActiveStageIndex(validActiveIndex - 1); // Swipe right = prev stage
        }
    };

    const renderColumnContent = (stage: Stage) => {
        const stageTasks = api.tasks.filter(t => t.stage === stage);
        const mainTasks = stageTasks.filter(t => !t.parent).sort((a, b) => a.position - b.position);

        return (
            <div style={{ padding: '0 8px 12px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mainTasks.map(main => (
                    <React.Fragment key={main._id}>
                        {readOnly ? (
                            <ViewerTaskItem task={main} isSubtask={false} />
                        ) : (
                            <TaskItem
                                task={main}
                                isSubtask={false}
                                readOnly={readOnly}
                                deleteTask={api.deleteTask}
                                moveNext={api.moveNext}
                                updateTask={api.updateTask}
                                swapPosition={api.swapPosition}
                                onShowInlineAdd={() => { }} // Mobile logic for inline add could be a modal
                                hoverPermissions={hoverPermissions}
                            />
                        )}
                        {/* Subtasks */}
                        {stageTasks
                            .filter(s => s.parent === main._id)
                            .sort((a, b) => a.position - b.position)
                            .map(sub => (
                                readOnly ? (
                                    <ViewerTaskItem key={sub._id} task={sub} isSubtask={true} />
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
                                        onShowInlineAdd={() => { }}
                                        hoverPermissions={hoverPermissions}
                                    />
                                )
                            ))}
                    </React.Fragment>
                ))}

                {/* Mobile Add Task Input */}
                {!readOnly && (
                    <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--c-card-hover)', border: '1px solid var(--c-border)' }}>
                        <input
                            type="text"
                            className="input-dashed"
                            style={{ width: '100%', fontSize: '16px', padding: '8px', color: 'var(--c-title)' }} // Larger text for mobile touch
                            placeholder={`+ Add to ${stage}...`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    api.addTask(e.currentTarget.value.trim(), stage);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* Header for Active Stage */}
            <div style={{
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '20px',
                paddingRight: '20px',
                backgroundColor: STAGE_BGS[activeStage as keyof typeof STAGE_BGS],
                color: STAGE_COLORS[activeStage as keyof typeof STAGE_COLORS],
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--c-border)'
            }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                    {HEADINGS[activeStage as keyof typeof HEADINGS]}
                </h2>
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'var(--c-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>{api.tasks.filter(t => t.stage === activeStage && !t.parent).length} Tasks</span>
                    {!readOnly && (
                        <Settings
                            size={16}
                            style={{ cursor: 'pointer', opacity: 0.8 }}
                            onClick={() => setSettingsOpen(true)}
                        />
                    )}
                </div>
            </div>

            {/* Swipeable Container */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--c-column-bg)' }}>
                <AnimatePresence initial={false}>
                    <motion.div
                        key={validActiveIndex}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '12px' }}
                    >
                        {renderColumnContent(activeStage)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation Bar */}
            <div style={{
                display: 'flex',
                backgroundColor: 'var(--c-toolbar)',
                borderTop: '1px solid var(--c-border)',
                paddingBottom: 'env(safe-area-inset-bottom)', /* iOS Safe Area Support */
                height: 'calc(60px + env(safe-area-inset-bottom))'
            }}>
                {visibleStages.map((stage, idx) => {
                    const Icon = STAGE_ICONS[stage as keyof typeof STAGE_ICONS];
                    const isActive = idx === validActiveIndex;
                    const color = isActive ? STAGE_COLORS[stage as keyof typeof STAGE_COLORS] : 'var(--c-text-secondary)';

                    return (
                        <div
                            key={stage}
                            onClick={() => setActiveStageIndex(idx)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                color: color
                            }}
                        >
                            <Icon size={24} style={{ opacity: isActive ? 1 : 0.6 }} />
                            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, opacity: isActive ? 1 : 0.8 }}>
                                {stage === 'Site Visit' ? 'Visit' : stage}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Settings Password/Toggles Modal */}
            {settingsOpen && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'var(--c-bg)', width: '100%', maxWidth: '380px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--c-title)' }}>Stage Settings</h3>
                            <button onClick={closeSettings} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--c-text-secondary)' }}>&times;</button>
                        </div>

                        {!isAuthenticated ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: '14px' }}>Please enter the password to modify mobile stage visibility.</p>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={passwordAttempt}
                                    onChange={e => setPasswordAttempt(e.target.value)}
                                    style={{
                                        padding: '12px', borderRadius: '8px', border: '1px solid var(--c-border)',
                                        backgroundColor: 'var(--c-card-bg)', color: 'var(--c-title)', fontSize: '16px'
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (passwordAttempt === 'Forever@CNC@2026') setIsAuthenticated(true);
                                            else alert('Incorrect password!');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (passwordAttempt === 'Forever@CNC@2026') setIsAuthenticated(true);
                                        else alert('Incorrect password!');
                                    }}
                                    style={{
                                        padding: '12px', borderRadius: '8px', backgroundColor: 'var(--c-btn-on)',
                                        color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px'
                                    }}
                                >
                                    Unlock
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--c-title)' }}>Stage Visibility</h4>
                                    <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: '12px' }}>Turn ON the stages you want visible on this device.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                        {STAGES.map(stage => {
                                            const isEnabled = enabledStages.includes(stage);
                                            return (
                                                <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--c-border)' }}>
                                                    <span style={{ color: 'var(--c-title)', fontSize: '14px', fontWeight: 500 }}>{stage}</span>
                                                    <div
                                                        onClick={() => toggleStage(stage)}
                                                        style={{
                                                            width: '40px', height: '22px', borderRadius: '11px',
                                                            backgroundColor: isEnabled ? 'var(--c-btn-on)' : 'var(--c-border)',
                                                            position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                                                            position: 'absolute', top: '2px', left: isEnabled ? '20px' : '2px',
                                                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--c-title)' }}>Hover Panel Actions</h4>
                                    <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: '12px' }}>Enable/Disable specific action buttons on the hover panel.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                        {[
                                            { key: 'showMoveNext', label: 'Move Next Stage (✅)' },
                                            { key: 'showDelete', label: 'Delete Task (❌)' },
                                            { key: 'showAddSubtask', label: 'Add Subtask (➕)' },
                                            { key: 'showUrgent', label: 'Toggle Urgent (🔥)' },
                                            { key: 'showSwap', label: 'Reorder Up/Down (⬆/⬇)' }
                                        ].map(item => {
                                            const permKey = item.key as keyof typeof hoverPermissions;
                                            const isEnabled = hoverPermissions[permKey];
                                            return (
                                                <div key={permKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--c-border)' }}>
                                                    <span style={{ color: 'var(--c-title)', fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                                                    <div
                                                        onClick={() => togglePermission(permKey)}
                                                        style={{
                                                            width: '40px', height: '22px', borderRadius: '11px',
                                                            backgroundColor: isEnabled ? 'var(--c-btn-on)' : 'var(--c-border)',
                                                            position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                                                            position: 'absolute', top: '2px', left: isEnabled ? '20px' : '2px',
                                                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--c-title)' }}>Server Connection</h4>
                                    <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: '12px' }}>Enter your desktop's IP address so the APK can reach your task database.<br />Format: http://192.168.x.x:5175/api</p>
                                    <input
                                        type="text"
                                        placeholder="http://192.168.1.5:5175/api"
                                        value={serverUrl}
                                        onChange={e => {
                                            setServerUrl(e.target.value);
                                            localStorage.setItem('mobileServerUrl', e.target.value);
                                        }}
                                        style={{
                                            padding: '10px', borderRadius: '8px', border: '1px solid var(--c-border)',
                                            backgroundColor: 'var(--c-card-bg)', color: 'var(--c-title)', fontSize: '14px'
                                        }}
                                    />
                                    <p style={{ margin: 0, color: serverUrl ? '#4ade80' : 'var(--c-text-secondary)', fontSize: '11px' }}>
                                        {serverUrl ? `✅ Pointing to: ${serverUrl}` : '⚠️ No server URL set — tasks won\'t load in standalone APK mode'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
