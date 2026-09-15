import { ChallengeType } from "../types/types"
import type { ChallengeGenerator } from "./types"
import { mathChallenge } from "./math.challenge"
import { textChallenge } from "./text.challenge"
import { imageSelectionChallenge } from "./image-selection.challenge"

const generators: Partial<Record<ChallengeType, ChallengeGenerator>> = {
    [ChallengeType.Math]: mathChallenge,
    [ChallengeType.Text]: textChallenge,
    [ChallengeType.ImageSelection]: imageSelectionChallenge
}

// Which challenge type appears at which stage number.
const stagePlan: ChallengeType[] = [ChallengeType.Math, ChallengeType.Text, ChallengeType.ImageSelection]

export function getChallengeTypeForStage(stage: number): ChallengeType {
    const type = stagePlan[stage - 1]
    if (!type) throw new Error(`No challenge configured for stage ${stage}`)
    return type
}

export function getGenerator(type: ChallengeType): ChallengeGenerator {
    const generator = generators[type]
    if (!generator) throw new Error(`No generator registered for type ${type}`)
    return generator
}

