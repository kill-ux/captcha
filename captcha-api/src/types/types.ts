
export type ImageItem = {
    id: string;
    path: string;
}

export enum Status {
    Active = "active",
    Completed = "completed",
}

export type CaptchaSession = {
    sessionId: string;
    currentStage: number;
    score: number;
    totalStages: number;
    challenges: CaptchaChallenge[];
    startedAt: string;
    updatedAt: string;
}

export enum ChallengeType {
    Text = "text",
    Math = "math",
    ImageSelection = "image-selection"
}

export type CaptchaChallenge = {
    id: string;
    type: ChallengeType;
    status: Status;
    images: ImageItem[];
    answerHash: string;
    completedAt: string | null;
}
