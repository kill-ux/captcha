import type { FastifyInstance } from "fastify"
import { getCurrentChallenge, verifyChallenge } from "../services/captcha.service"
import { requireSession } from "../plugins/session.plugin"

export async function captchaRoutes(app: FastifyInstance) {
    app.get("/captcha", { preHandler: requireSession }, async (request) => {
        const challenge = await getCurrentChallenge(request.session!)
        if (!challenge) return { status: "completed" }

        return {
            id: challenge.id,
            type: challenge.type,
            status: challenge.status,
            images: challenge.images.map((image) => image.id),
            completedAt: challenge.completedAt
        }
    })

    app.get("/captcha/images/:image_id", { preHandler: requireSession }, async (request, reply) => {
        const { image_id } = request.params as { image_id?: string }
        const challenge = await getCurrentChallenge(request.session!)
        const image = challenge?.images.find((item) => item.id === image_id)

        if (!image) {
            return reply.code(404).send({ status: "error", message: "Image not found" })
        }
        return reply.sendFile(image.path)
    })

    app.post("/captcha/verify", { preHandler: requireSession }, async (request, reply) => {
        const { challengeId, answer } = request.body as { challengeId?: string; answer?: string }
        if (!challengeId || answer === undefined) {
            return reply.code(400).send({ status: "error", message: "challengeId and answer are required" })
        }

        const result = await verifyChallenge(request.session!, challengeId, answer)

        if (!result.ok) {
            return reply.code(404).send({ status: "error", message: "Challenge not found or already completed" })
        }
        if (!result.correct) {
            return { status: "incorrect" }
        }
        return { status: "correct", completed: result.completed, nextStage: result.nextStage }
    })
}
