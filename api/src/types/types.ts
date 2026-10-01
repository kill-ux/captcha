export type ImageItem = {
    id: string;
    path: string;
}

export enum Status {
    Active = "active",
    Completed = "completed",
}

export enum ChallengeType {
    Text = "text",
    Math = "math",
    ImageSelection = "image-selection"
}

export type Answer = string | string[]

export type CaptchaSession = {
    sessionId: string;
    currentStage: number;
    score: number;
    totalStages: number;
    /** Challenge type for each stage (index 0 = stage 1), shuffled per session. */
    stagePlan: ChallengeType[];
    challenges: CaptchaChallenge[];
    startedAt: string;
    updatedAt: string;
    completedAt: string | null;
}

export type CaptchaChallenge = {
    id: string;
    type: ChallengeType;
    /** 1-based stage number this challenge belongs to. */
    stage: number;
    status: Status;
    images: ImageItem[];
    answerHash: string;
    /** Number of wrong answers given for this stage so far. */
    attempts: number;
    /** The accepted answer, kept so a completed stage can be revisited read-only. */
    submittedAnswer?: Answer;
    completedAt: string | null;
    prompt?: string
}
