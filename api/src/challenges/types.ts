import type { Answer, CaptchaChallenge, ChallengeType, ImageItem } from "../types/types"

export type GeneratedChallenge = {
    images: ImageItem[]
    answerHash: string,
    prompt?: string
}

export interface ChallengeGenerator {
    type: ChallengeType
    generate(): Promise<GeneratedChallenge>
    verify(answer: Answer, challenge: CaptchaChallenge): boolean
    normalize(answer: Answer): Answer
}
