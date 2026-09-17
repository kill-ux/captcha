export enum ChallengeType {
    Text = 'text',
    Math = 'math',
    ImageSelection = 'image-selection'
}

export interface ChallengeResponse {
    status?: 'completed';
    id?: string;
    type?: ChallengeType;
    images?: string[];
    completedAt?: string | null;
    prompt?: string;
}

export interface VerifyResponse {
    status: 'correct' | 'incorrect' | 'error';
    completed?: boolean;
    nextStage?: number | null;
    message?: string;
}
