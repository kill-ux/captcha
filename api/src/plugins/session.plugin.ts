import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { getSessionFromCookie } from "../services/captcha.service"
import type { CaptchaSession } from "../types/types"

declare module "fastify" {
    interface FastifyRequest {
        session: CaptchaSession | null
    }
}

export function registerSessionPlugin(app: FastifyInstance): void {
    app.decorateRequest("session", null)
    app.addHook("onRequest", async (request) => {
        const cookieHeader = request.headers.cookie as string | undefined
        request.session = await getSessionFromCookie(cookieHeader)
    })
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
    if (!request.session) {
        return reply.code(401).send({ status: "error", message: "Missing session" })
    }
}
