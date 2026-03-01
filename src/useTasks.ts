import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Stage } from './types';
import { dbAPI } from './api';

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const dataHashRef = useRef<string>('');

    const fetchTasks = useCallback(async (forceUpdate = false) => {
        try {
            const data = await dbAPI.loadTasks();

            // Calculate a simple hash to prevent unnecessary re-renders (similar to C# logic)
            const newHash = data.map(t => `${t._id}${t.name}${t.stage}${t.parent}${t.urgent}${t.position}`).join('');

            if (forceUpdate || newHash !== dataHashRef.current) {
                dataHashRef.current = newHash;
                setTasks(data);
            }
        } catch (err) {
            console.error("Failed to load tasks:", err);
        } finally {
            if (loading) setLoading(false);
        }
    }, [loading]);

    // Initial load & Polling setup (consistent with the WinForms 3000ms timer)
    useEffect(() => {
        fetchTasks();
        const interval = setInterval(() => fetchTasks(), 3000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

    const addTask = async (name: string, stage: Stage, parentId: string | null = null) => {
        await dbAPI.addTask({ name, stage, parent: parentId });
        await fetchTasks(true);
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (updates.urgent === true) {
            const task = tasks.find(t => t._id === id);
            if (task && task.parent) {
                await dbAPI.updateMultiple([
                    { id: id, changes: updates },
                    { id: task.parent, changes: { urgent: true } }
                ]);
                await fetchTasks(true);
                return;
            }
        }
        await dbAPI.updateTask(id, updates);
        await fetchTasks(true);
    };

    const deleteTask = async (id: string) => {
        await dbAPI.deleteTask(id);
        await fetchTasks(true);
    };

    const swapPosition = async (task: Task, direction: number) => {
        // direction: -1 (up), 1 (down)
        const siblings = tasks
            .filter(t => t.stage === task.stage && t.parent === task.parent)
            .sort((a, b) => a.position - b.position);

        const currentIndex = siblings.findIndex(t => t._id === task._id);
        if (currentIndex === -1) return;

        const targetIndex = currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= siblings.length) return; // Cannot move further

        const otherTask = siblings[targetIndex];

        // Swap positions
        await dbAPI.updateMultiple([
            { id: task._id, changes: { position: otherTask.position } },
            { id: otherTask._id, changes: { position: task.position } }
        ]);
        await fetchTasks(true);
    };

    const moveNext = async (task: Task) => {
        const stages: Stage[] = ['Site Visit', 'Quotation', 'Design', 'CNC', 'Completed'];
        const currentIndex = stages.indexOf(task.stage as Stage);
        if (currentIndex === -1 || currentIndex === stages.length - 1) return; // Already completed

        const nextStage = stages[currentIndex + 1];

        if (task.parent) {
            // Complex logic for moving subtasks: find/create parent in next stage
            const originalParent = tasks.find(t => t._id === task.parent);
            if (!originalParent) return;

            const pName = originalParent.name;
            const existingParentInNextStage = tasks.find(t => t.stage === nextStage && t.name === pName && !t.parent);

            let newParentId = existingParentInNextStage?._id;

            if (!newParentId) {
                const result = await dbAPI.addTask({ name: pName, stage: nextStage, parent: null });
                newParentId = result.id;
            }

            await dbAPI.updateTask(task._id, { stage: nextStage, parent: newParentId });
        } else {
            // Check if there is already a main task in the next stage with the exact same name
            const existingSameNamedParent = tasks.find(t => t.stage === nextStage && t.name === task.name && !t.parent);
            const children = tasks.filter(t => t.parent === task._id);

            if (existingSameNamedParent) {
                // Merge: Re-parent all children to the existing task, then delete the moving main task
                const updates = children.map(c => ({ id: c._id, changes: { stage: nextStage, parent: existingSameNamedParent._id } }));
                if (updates.length > 0) {
                    await dbAPI.updateMultiple(updates);
                }
                await dbAPI.deleteTask(task._id);
            } else {
                // Move main task and let children stay with it
                const updates = children.map(c => ({ id: c._id, changes: { stage: nextStage } }));
                updates.push({ id: task._id, changes: { stage: nextStage } });

                await dbAPI.updateMultiple(updates);
            }
        }
        await fetchTasks(true);
    };

    const moveTaskStage = async (task: Task, newStage: Stage) => {
        if (task.stage === newStage) return;

        if (task.parent) {
            // Complex logic for moving subtasks: find/create parent in new stage
            const originalParent = tasks.find(t => t._id === task.parent);
            if (!originalParent) return;

            const pName = originalParent.name;
            const existingParentInNewStage = tasks.find(t => t.stage === newStage && t.name === pName && !t.parent);

            let newParentId = existingParentInNewStage?._id;

            if (!newParentId) {
                const result = await dbAPI.addTask({ name: pName, stage: newStage, parent: null });
                newParentId = result.id;
            }

            await dbAPI.updateTask(task._id, { stage: newStage, parent: newParentId });
        } else {
            // Check if there is already a main task in the new stage with the exact same name
            const existingSameNamedParent = tasks.find(t => t.stage === newStage && t.name === task.name && !t.parent);
            const children = tasks.filter(t => t.parent === task._id);

            if (existingSameNamedParent) {
                // Merge: Re-parent all children to the existing task, then delete the moving main task
                const updates = children.map(c => ({ id: c._id, changes: { stage: newStage, parent: existingSameNamedParent._id } }));
                if (updates.length > 0) {
                    await dbAPI.updateMultiple(updates);
                }
                await dbAPI.deleteTask(task._id);
            } else {
                // Move main task and let children stay with it
                const updates = children.map(c => ({ id: c._id, changes: { stage: newStage } }));
                updates.push({ id: task._id, changes: { stage: newStage } });

                await dbAPI.updateMultiple(updates);
            }
        }
        await fetchTasks(true);
    };

    return {
        tasks,
        loading,
        addTask,
        updateTask,
        deleteTask,
        swapPosition,
        moveNext,
        moveTaskStage
    };
}
