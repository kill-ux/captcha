import type { FastifyInstance } from "fastify"
import { createSession, resetSession } from "../services/captcha.service"

// HttpOnly keeps the id away from scripts; SameSite=Lax blocks cross-site POSTs.
const sessionCookie = (sessionId: string) => `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax`

export async function sessionRoutes(app: FastifyInstance) {
    app.post("/captcha/sessions", async (request, reply) => {
        if (request.session) {
            return { message: "Session already exists" }
        }

        const session = await createSession()
        reply.header("set-cookie", sessionCookie(session.sessionId))
        return { session: { totalStages: session.totalStages, currentStage: session.currentStage } }
    })

    app.post("/captcha/sessions/reset", async (request, reply) => {
        const session = request.session
            ? await resetSession(request.session.sessionId)
            : await createSession()

        reply.header("set-cookie", sessionCookie(session.sessionId))
        return { session: { totalStages: session.totalStages, currentStage: session.currentStage } }
    })
}
