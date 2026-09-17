import crypto from "crypto"
import { CaptchaSessionRepository } from "../repositories/session.repository"
import type { CaptchaChallenge, CaptchaSession } from "../types/types"
import { Status } from "../types/types"
import { getChallengeTypeForStage, getGenerator } from "../challenges/registry"
import type { GeneratedChallenge } from "../challenges/types";

const repository = new CaptchaSessionRepository()

export async function getSessionFromCookie(cookieHeader: string | undefined): Promise<CaptchaSession | null> {
    const sessionId = cookieHeader
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("sessionId="))
        ?.slice("sessionId=".length)

    if (!sessionId) return null

    const session = await repository.findById(sessionId)
    if (session) await repository.refresh(sessionId)
    return session
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
    await repository.save(session)
    return session
}

async function createChallengeForCurrentStage(session: CaptchaSession): Promise<CaptchaChallenge> {
    const type = getChallengeTypeForStage(session.currentStage)
    const generator = getGenerator(type)
    const generated: GeneratedChallenge = await generator.generate()

    const challenge: CaptchaChallenge = {
        id: crypto.randomUUID(),
        type,
        status: Status.Active,
        images: generated.images,
        prompt: generated.prompt,
        answerHash: generated.answerHash,
        completedAt: null
    }

    session.challenges.push(challenge)
    await repository.save(session)
    return challenge
}

export async function getCurrentChallenge(session: CaptchaSession): Promise<CaptchaChallenge | null> {
    const active = session.challenges.find((c) => c.status === Status.Active)
    if (active) return active
    if (session.currentStage > session.totalStages) return null
    return createChallengeForCurrentStage(session)
}

export type VerifyResult =
    | { ok: true; correct: true; completed: boolean; nextStage: number | null }
    | { ok: true; correct: false }
    | { ok: false; reason: "not-found" }

export async function verifyChallenge(
    session: CaptchaSession,
    challengeId: string,
    answer: string
): Promise<VerifyResult> {
    const challenge = session.challenges.find((c) => c.id === challengeId && c.status === Status.Active)
    if (!challenge) return { ok: false, reason: "not-found" }

    const correct = getGenerator(challenge.type).verify(answer, challenge)
    if (!correct) return { ok: true, correct: false }

    challenge.status = Status.Completed
    challenge.completedAt = new Date().toISOString()
    session.score += 1
    session.currentStage += 1
    session.updatedAt = new Date().toISOString()
    await repository.save(session)

    const completed = session.currentStage > session.totalStages
    return { ok: true, correct: true, completed, nextStage: completed ? null : session.currentStage }
}


export async function resetSession(oldSessionId: string): Promise<CaptchaSession> {
    await repository.delete(oldSessionId)
    return createSession()
}