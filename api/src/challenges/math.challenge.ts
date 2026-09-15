import crypto from "crypto"
import { readdir } from "fs/promises"
import { dirname, join, extname, basename } from "path"
import { fileURLToPath } from "url"
import { ChallengeType } from "../types/types"
import type { ChallengeGenerator, GeneratedChallenge } from "./types"
import { sha256, verifyHash } from "../utils/hash"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MATH_DIR = join(__dirname, "..", "..", "res", "math")

async function listMathImages(): Promise<{ path: string; answer: number }[]> {
    const entries = await readdir(MATH_DIR, { withFileTypes: true })

    const images = entries
        .filter((f) => f.isFile() && extname(f.name).toLowerCase() === ".png")
        .flatMap((f) => {
            const stem = basename(f.name, ".png")
            const match = stem.match(/^(\d+)\+(\d+)$/)
            if (!match) return []
            const [, a, b] = match
            if (!a || !b) return []
            return [{ path: join("math", f.name), answer: parseInt(a, 10) + parseInt(b, 10) }]
        })

    if (images.length === 0) {
        throw new Error(`No usable math images found in ${MATH_DIR}`)
    }
    return images
}

export const mathChallenge: ChallengeGenerator = {
    type: ChallengeType.Math,

    async generate(): Promise<GeneratedChallenge> {
        const images = await listMathImages()
        const pick = images[Math.floor(Math.random() * images.length)]!
        return {
            images: [{ id: crypto.randomUUID(), path: pick.path }],
            answerHash: sha256(pick.answer.toString())
        }
    },

    verify(answer: string, challenge): boolean {
        return verifyHash(answer.trim(), challenge.answerHash)
    }
}
