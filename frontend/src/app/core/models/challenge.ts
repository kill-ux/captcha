// export enum ChallengeType {
//     Text = 'text',
//     Math = 'math',
//     ImageSelection = 'image-selection'
// }

// export interface ChallengeResponse {
//     status?: 'completed';
//     id?: string;
//     type?: ChallengeType;
//     images?: string[];
//     completedAt?: string | null;
//     prompt?: string;
// }

// export interface VerifyResponse {
//     status: 'correct' | 'incorrect' | 'error';
//     completed?: boolean;
//     nextStage?: number | null;
//     message?: string;
// }


export enum ChallengeType {
    Text = 'text',
    Math = 'math',
    ImageSelection = 'image-selection'
}

export const CHALLENGE_LABELS: Record<ChallengeType, string> = {
    [ChallengeType.Math]: 'Math',
    [ChallengeType.Text]: 'Text',
    [ChallengeType.ImageSelection]: 'Image selection',
};

export type Answer = string | string[];

export interface Progress {
    /** Highest stage the user may open (the one to solve next, or the last one when finished). */
    currentStage: number;
    totalStages: number;
    completed: boolean;
}

export interface ChallengeView {
    id: string;
    type: ChallengeType;
    stage: number;
    status: 'active' | 'completed';
    prompt?: string;
    images: string[];
    /** Wrong answers given so far on this stage. */
    attempts: number;
    /** Only present for solved stages, so they can be reviewed read-only. */
    submittedAnswer?: Answer;
    completedAt: string | null;
}

export interface StageResponse {
    progress: Progress;
    /** null once every stage is solved and the current stage was requested. */
    challenge: ChallengeView | null;
}

export interface VerifyResponse {
    status: 'correct' | 'incorrect';
    completed?: boolean;
    nextStage?: number | null;
    attempts?: number;
}

export interface StageResult {
    stage: number;
    type: ChallengeType;
    attempts: number;
    solvedFirstTry: boolean;
    completedAt: string | null;
}

export interface ResultResponse {
    /** Stages solved on the first attempt. */
    score: number;
    totalStages: number;
    failedAttempts: number;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    stages: StageResult[];
}
