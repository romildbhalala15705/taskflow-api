export interface Task {
    _id: string;
    name: string;
    stage: string;
    parent: string | null;
    urgent: boolean;
    position: number;
    created: string;
}

export type Stage = 'Site Visit' | 'Quotation' | 'Design' | 'CNC' | 'Completed';

export const STAGES: Stage[] = ['Site Visit', 'Quotation', 'Design', 'CNC', 'Completed'];
