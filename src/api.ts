import { Task } from './types'

// Add typing for window.db
declare global {
    interface Window {
        db?: {
            checkDb: () => Promise<boolean>;
            loadTasks: () => Promise<Task[]>;
            addTask: (data: { name: string, stage: string, parent?: string | null }) => Promise<{ id: string }>;
            updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
            deleteTask: (id: string) => Promise<boolean>;
            updateMultiple: (updates: { id: string, changes: Partial<Task> }[]) => Promise<boolean>;
        };
    }
}

// Fallback HTTP Client for Mobile/Capacitor using the Express server we built in main.ts
class MobileHTTPDB {
    // In Capacitor APK, relative /api won't work — we need the full URL to the desktop Express server.
    // The user sets this in Settings > Server URL (e.g. http://192.168.1.5:5175/api)
    // Falls back to relative /api for Vite dev proxy.
    private get baseUrl(): string {
        const saved = localStorage.getItem('mobileServerUrl');
        if (saved && saved.trim()) return saved.trim();
        return `/api`;
    }

    async checkDb(): Promise<boolean> {
        return fetch(`${this.baseUrl}/check`).then(r => r.json()).then(d => d.success).catch(() => false);
    }

    async loadTasks(): Promise<Task[]> {
        return fetch(`${this.baseUrl}/tasks`).then(r => r.json()).catch(() => []);
    }

    async addTask(data: { name: string, stage: string, parent?: string | null }): Promise<{ id: string }> {
        const res = await fetch(`${this.baseUrl}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }

    async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
        const res = await fetch(`${this.baseUrl}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        const data = await res.json();
        return data.success;
    }

    async deleteTask(id: string): Promise<boolean> {
        const res = await fetch(`${this.baseUrl}/tasks/${id}`, { method: 'DELETE' });
        const data = await res.json();
        return data.success;
    }

    async updateMultiple(updates: { id: string, changes: Partial<Task> }[]): Promise<boolean> {
        const res = await fetch(`${this.baseUrl}/tasks/multiple`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        const data = await res.json();
        return data.success;
    }
}

export const dbAPI = window.db || new MobileHTTPDB();
