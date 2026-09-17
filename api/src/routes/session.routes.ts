import type { FastifyInstance } from "fastify"
import { createSession, resetSession } from "../services/captcha.service"

export async function sessionRoutes(app: FastifyInstance) {
    app.post("/captcha/sessions", async (request, reply) => {
        if (request.session) {
            return { message: "Session already exists" }
        }

        const session = await createSession()
        reply.header("set-cookie", `sessionId=${session.sessionId}; Path=/; HttpOnly;`)
        return { session }
    })

    app.post("/captcha/sessions/reset", async (request, reply) => {
        const session = request.session
            ? await resetSession(request.session.sessionId)
            : await createSession()

        reply.header("set-cookie", `sessionId=${session.sessionId}; Path=/; HttpOnly;`)
        return { session }
    })
}
