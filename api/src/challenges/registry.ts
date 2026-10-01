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

const ALL_TYPES: ChallengeType[] = [ChallengeType.Math, ChallengeType.Text, ChallengeType.ImageSelection]

/**
 * Builds the challenge order for a new session: every type exactly once,
 * in a random order (Fisher-Yates), so each session gets a different set/order.
 */
export function buildStagePlan(): ChallengeType[] {
    const plan = [...ALL_TYPES]
    for (let i = plan.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [plan[i], plan[j]] = [plan[j]!, plan[i]!]
    }
    return plan
}

export function getGenerator(type: ChallengeType): ChallengeGenerator {
    const generator = generators[type]
    if (!generator) throw new Error(`No generator registered for type ${type}`)
    return generator
}
