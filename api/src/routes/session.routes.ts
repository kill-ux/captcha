import type { FastifyInstance } from "fastify"
import { createSession } from "../services/captcha.service"

export async function sessionRoutes(app: FastifyInstance) {
    app.post("/captcha/sessions", async (request, reply) => {
        if (request.session) {
            return { message: "Session already exists" }
        }

        const session = await createSession()
        reply.header("set-cookie", `sessionId=${session.sessionId}; Path=/; HttpOnly;`)
        return { session }
    })
}
