import type { FastifyInstance } from "fastify"
import {
    buildResult,
    findImage,
    getChallengeForStage,
    getCurrentChallenge,
    isCompleted,
    verifyChallenge,
} from "../services/captcha.service"
import { requireSession } from "../plugins/session.plugin"
import { Status } from "../types/types"
import type { CaptchaChallenge, CaptchaSession } from "../types/types"

function progressOf(session: CaptchaSession) {
    return {
        currentStage: Math.min(session.currentStage, session.totalStages),
        totalStages: session.totalStages,
        completed: isCompleted(session),
    }
}

function viewOf(challenge: CaptchaChallenge) {
    const solved = challenge.status === Status.Completed
    return {
        id: challenge.id,
        type: challenge.type,
        stage: challenge.stage,
        status: challenge.status,
        prompt: challenge.prompt,
        images: challenge.images.map((image) => image.id),
        attempts: challenge.attempts,
        submittedAnswer: solved ? challenge.submittedAnswer : undefined,
        completedAt: challenge.completedAt,
    }
}

function isValidAnswer(answer: unknown): answer is string | string[] {
    return typeof answer === "string"
        || (Array.isArray(answer) && answer.length <= 50 && answer.every((item) => typeof item === "string"))
}

export async function captchaRoutes(app: FastifyInstance) {
    // Current stage (or challenge: null once everything is solved).
    app.get("/captcha", { preHandler: requireSession }, async (request) => {
        const session = request.session!
        const challenge = await getCurrentChallenge(session)
        return { progress: progressOf(session), challenge: challenge ? viewOf(challenge) : null }
    })

    // Any reachable stage: the current one, or an already solved one (read-only revisit).
    app.get("/captcha/stages/:stage", { preHandler: requireSession }, async (request, reply) => {
        const session = request.session!
        const { stage } = request.params as { stage: string }
        const challenge = /^\d+$/.test(stage) ? await getChallengeForStage(session, Number(stage)) : null

        if (!challenge) {
            return reply.code(404).send({ status: "error", message: "Stage not available" })
        }
        return { progress: progressOf(session), challenge: viewOf(challenge) }
    })

    // Summary shown on the results page. Refused until all stages are solved.
    app.get("/captcha/result", { preHandler: requireSession }, async (request, reply) => {
        const result = buildResult(request.session!)
        if (!result) {
            return reply.code(403).send({ status: "error", message: "Challenge not completed" })
        }
        return result
    })

    app.get("/captcha/images/:image_id", { preHandler: requireSession }, async (request, reply) => {
        const { image_id } = request.params as { image_id?: string }
        const image = image_id ? findImage(request.session!, image_id) : null

        if (!image) {
            return reply.code(404).send({ status: "error", message: "Image not found" })
        }
        return reply.sendFile(image.path)
    })

    app.post("/captcha/verify", { preHandler: requireSession }, async (request, reply) => {
        const { challengeId, answer } = (request.body ?? {}) as { challengeId?: unknown; answer?: unknown }
        if (typeof challengeId !== "string" || !isValidAnswer(answer)) {
            return reply.code(400).send({
                status: "error",
                message: "challengeId (string) and answer (string or string[]) are required",
            })
        }

        const result = await verifyChallenge(request.session!, challengeId, answer)

        if (!result.ok) {
            return reply.code(404).send({ status: "error", message: "Challenge not found or already completed" })
        }
        if (!result.correct) {
            return { status: "incorrect", attempts: result.attempts }
        }
        return { status: "correct", completed: result.completed, nextStage: result.nextStage }
    })
}
