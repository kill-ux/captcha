
import crypto from "crypto"
import { CaptchaSessionRepository } from "../repositories/session.repository"
import type { Answer, CaptchaChallenge, CaptchaSession, ChallengeType } from "../types/types"
import { Status } from "../types/types"
import { buildStagePlan, getGenerator } from "../challenges/registry"

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
    const stagePlan = buildStagePlan()
    const session: CaptchaSession = {
        sessionId: crypto.randomUUID(),
        currentStage: 1,
        totalStages: stagePlan.length,
        stagePlan,
        score: 0,
        challenges: [],
        startedAt: now,
        updatedAt: now,
        completedAt: null
    }
    await repository.save(session)
    return session
}

export function isCompleted(session: CaptchaSession): boolean {
    return session.currentStage > session.totalStages
}

async function generateChallenge(session: CaptchaSession, stage: number, attempts: number): Promise<CaptchaChallenge> {
    const type: ChallengeType | undefined = session.stagePlan[stage - 1]
    if (!type) throw new Error(`No challenge configured for stage ${stage}`)

    const generated = await getGenerator(type).generate()
    return {
        id: crypto.randomUUID(),
        type,
        stage,
        status: Status.Active,
        images: generated.images,
        prompt: generated.prompt,
        answerHash: generated.answerHash,
        attempts,
        completedAt: null
    }
}

/**
 * Returns the challenge of a given stage, or null when that stage is out of reach.
 * A stage is reachable when it is the current one (created lazily) or an already solved one.
 */
export async function getChallengeForStage(session: CaptchaSession, stage: number): Promise<CaptchaChallenge | null> {
    if (!Number.isInteger(stage) || stage < 1 || stage > session.totalStages) return null
    if (stage > session.currentStage) return null

    const existing = session.challenges.find((c) => c.stage === stage)
    if (existing) return existing

    if (stage !== session.currentStage) return null

    const challenge = await generateChallenge(session, stage, 0)
    session.challenges.push(challenge)
    await repository.save(session)
    return challenge
}

export async function getCurrentChallenge(session: CaptchaSession): Promise<CaptchaChallenge | null> {
    if (isCompleted(session)) return null
    return getChallengeForStage(session, session.currentStage)
}

/** Every image the session is allowed to see (current + already solved stages). */
export function findImage(session: CaptchaSession, imageId: string) {
    for (const challenge of session.challenges) {
        const image = challenge.images.find((item) => item.id === imageId)
        if (image) return image
    }
    return null
}

export type VerifyResult =
    | { ok: true; correct: true; completed: boolean; nextStage: number | null }
    | { ok: true; correct: false; attempts: number }
    | { ok: false; reason: "not-found" }

export async function verifyChallenge(
    session: CaptchaSession,
    challengeId: string,
    answer: Answer
): Promise<VerifyResult> {
    const index = session.challenges.findIndex((c) => c.id === challengeId && c.status === Status.Active)
    const challenge = session.challenges[index]
    if (!challenge) return { ok: false, reason: "not-found" }

    const generator = getGenerator(challenge.type)
    const now = new Date().toISOString()

    if (!generator.verify(answer, challenge)) {
        const fresh = await generateChallenge(session, challenge.stage, challenge.attempts + 1)
        session.challenges[index] = fresh
        session.updatedAt = now
        await repository.save(session)
        return { ok: true, correct: false, attempts: fresh.attempts }
    }

    challenge.status = Status.Completed
    challenge.completedAt = now
    challenge.submittedAnswer = generator.normalize(answer)
    if (challenge.attempts === 0) session.score += 1
    session.currentStage += 1
    session.updatedAt = now

    const completed = isCompleted(session)
    if (completed) session.completedAt = now
    await repository.save(session)

    return { ok: true, correct: true, completed, nextStage: completed ? null : session.currentStage }
}

export type StageSummary = {
    stage: number
    type: ChallengeType
    attempts: number
    solvedFirstTry: boolean
    completedAt: string | null
}

export type ResultSummary = {
    score: number
    totalStages: number
    failedAttempts: number
    startedAt: string
    completedAt: string
    durationMs: number
    stages: StageSummary[]
}

/** Builds the results page payload. Returns null until every stage has been solved. */
export function buildResult(session: CaptchaSession): ResultSummary | null {
    if (!isCompleted(session) || !session.completedAt) return null

    const stages = [...session.challenges]
        .sort((a, b) => a.stage - b.stage)
        .map((c) => ({
            stage: c.stage,
            type: c.type,
            attempts: c.attempts,
            solvedFirstTry: c.attempts === 0,
            completedAt: c.completedAt
        }))

    return {
        score: session.score,
        totalStages: session.totalStages,
        failedAttempts: stages.reduce((sum, s) => sum + s.attempts, 0),
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        durationMs: Date.parse(session.completedAt) - Date.parse(session.startedAt),
        stages
    }
}

export async function resetSession(oldSessionId: string): Promise<CaptchaSession> {
    await repository.delete(oldSessionId)
    return createSession()
}
