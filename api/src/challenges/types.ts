import type { CaptchaChallenge, ChallengeType, ImageItem } from "../types/types"

export type GeneratedChallenge = {
    images: ImageItem[]
    answerHash: string
}

export interface ChallengeGenerator {
    type: ChallengeType
    generate(): Promise<GeneratedChallenge>
    verify(answer: string | string[], challenge: CaptchaChallenge): boolean
}
