import crypto from "crypto"
import { readdir } from "fs/promises"
import { dirname, join, extname, basename } from "path"
import { fileURLToPath } from "url"
import { ChallengeType } from "../types/types"
import type { ChallengeGenerator, GeneratedChallenge } from "./types"
import { sha256, verifyHash } from "../utils/hash"

const TYPING = "typing"
const __dirname = dirname(fileURLToPath(import.meta.url))
const TEXT_DIR = join(__dirname, "..", "..", "res", TYPING)

async function listTextImages(): Promise<{ path: string; answer: string }[]> {
    const entries = await readdir(TEXT_DIR, { withFileTypes: true })

    const images = entries
        .filter((f) => f.isFile() && extname(f.name).toLowerCase() === ".png")
        .flatMap((f) => {
            const text = basename(f.name, ".png")
            if (!text) return []
            return [{ path: join(TYPING, f.name), answer: text }]
        })

    if (images.length === 0) {
        throw new Error(`No usable math images found in ${TEXT_DIR}`)
    }
    return images
}

export const textChallenge: ChallengeGenerator = {
    type: ChallengeType.Text,

    async generate(): Promise<GeneratedChallenge> {
        const images = await listTextImages()
        const pick = images[Math.floor(Math.random() * images.length)]!
        return {
            images: [{ id: crypto.randomUUID(), path: pick.path }],
            answerHash: sha256(pick.answer)
        }
    },

    verify(answer: string, challenge): boolean {
        return verifyHash(answer.trim(), challenge.answerHash)
    }
}
