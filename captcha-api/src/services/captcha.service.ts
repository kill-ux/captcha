import { CaptchaSessionRepository } from "../repositories/session.reposotory";
import type { CaptchaChallenge, CaptchaSession } from "../types/types"
import { dirname, join, extname, basename } from "path"
import { fileURLToPath, redis } from "bun";
import { readdir } from "fs/promises"

import { ChallengeType, Status, type ImageItem } from "../types/types"
import crypto from "crypto"



const repository = new CaptchaSessionRepository();

export const getSessionFromCookie = async (cookieHeader: string | undefined): Promise<CaptchaSession | null> => {
    const cookieSessionId = cookieHeader
        ?.split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("sessionId="))
        ?.replace("sessionId=", "")

    if (cookieSessionId) {
        const session = await repository.findById(cookieSessionId)
        if (session) {
            await repository.refresh(cookieSessionId)
            return session
        }
    }

    return  null
}


export async function createSession(): Promise<CaptchaSession> {
    const now = new Date().toISOString()
    const session: CaptchaSession = {
        sessionId: crypto.randomUUID(),
        currentStage: 1,
        totalStages: 3,
        score: 0,
        challenges: [],
        startedAt: now,
        updatedAt: now
    }

    repository.save(session)

    return session

}


const __dirname = dirname(fileURLToPath(import.meta.url))
const MATH_DIR = join(__dirname, "../..", "res", "math")
console.log(MATH_DIR)

export async function loadMathImage(): Promise<{ name: string; answer: number }> {
    const names: string[] = (await readdir(MATH_DIR, { withFileTypes: true }))
        .filter((f) => f.isFile() && extname(f.name).toLowerCase() === ".png")
        .map((f) => f.name)

    const mathImages = names.flatMap((name) => {
        const stem = basename(name, ".png")
        const match = stem.match(/^(\d+)\+(\d+)$/)
        if (!match) return []
        const [, a, b] = match
        if (!a || !b) return []
        const answer = parseInt(a, 10) + parseInt(b, 10)
        return [{ name: join(MATH_DIR, name), answer }]
    })

    if (mathImages.length === 0) {
        throw new Error(`No usable math images found in ${MATH_DIR}`)
    }

    // length > 0 guarantees this is defined; index safely anyway
    const pick = mathImages[Math.floor(Math.random() * mathImages.length)]
    if (!pick) {
        throw new Error("Unreachable: empty mathImages after length check")
    }
    return pick
}


async function generateMathChallenge(): Promise<{ image: string; answerHash: string; }> {
    const { name, answer } = await loadMathImage()
    const answerHash = crypto.createHash("sha256").update(answer.toString()).digest("hex")
    console.log("Math images loaded:", name, answer, answerHash)
    return { image: name, answerHash }
}

async function createChallenge(session: CaptchaSession): Promise<CaptchaChallenge> {
    switch (session.currentStage) {
        case 1:
            const { image, answerHash } = await generateMathChallenge()

            let challenge: CaptchaChallenge = {
                id: crypto.randomUUID(),
                type: ChallengeType.Math,
                status: Status.Active,
                images: [image],
                answerHash: answerHash,
                completedAt: null
            }

            session.challenges.push(challenge)
            repository.save(session)
            
            return challenge
        // case 2:
        //     return {
        //         id: crypto.randomUUID(),
        //         type: "math",
        //         status: "active",
        //         data: {
        //             question: "What is 5 * 3?",
        //             images: []
        //         },
        //         answerHash: crypto.createHash("sha256").update("15").digest("hex"),
        //         completedAt: null
        //     }
        // case 3:
        //     return {
        //         id: crypto.randomUUID(),
        //         type: "image-selection",
        //         status: "active",
        //         data: {
        //             question: "Select all images with a cat.",
        //             images: [
        //                 { id: crypto.randomUUID(), label: "cat", isCorrect: true },
        //                 { id: crypto.randomUUID(), label: "dog", isCorrect: false },
        //                 { id: crypto.randomUUID(), label: "cat", isCorrect: true },
        //                 { id: crypto.randomUUID(), label: "bird", isCorrect: false }
        //             ]
        //         },
        //         answerHash: crypto.createHash("sha256").update("cat,cat").digest("hex"),
        //         completedAt: null
        //     }
        default:
            throw new Error("Invalid stage")
    }
}


export async function getCurrentStage(session: CaptchaSession): Promise<CaptchaChallenge | null> {
    const currentChallenge = session.challenges.find(challenge => challenge.status === Status.Active)
    if (currentChallenge) {
        return currentChallenge
    } else {
        if (session.currentStage <= session.totalStages) {
            const newChallenge = await createChallenge(session)
            return newChallenge
        } else {
            return null
        }
    }
}
