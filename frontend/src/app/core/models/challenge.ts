export interface Challenge {}


export enum ChallengeType {
  Text = "text",
  Math = "math",
  ImageSelection = "image-selection"
}

export enum Status {
  Active = "active",
  Completed = "completed"
}

export interface ChallengeResponse {
  status?: "completed";
  id?: string;
  type?: ChallengeType;
  status_?: Status;
  images?: string[];
  completedAt?: string | null;
}

export interface VerifyResponse {
  status: "correct" | "incorrect" | "error";
  completed?: boolean;
  nextStage?: number | null;
  message?: string;
}
