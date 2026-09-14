import Fastify from "fastify"
import { ChallengeType, Status, type CaptchaChallenge, type CaptchaSession, type ImageItem } from "./types/types"
import crypto from "crypto"
import { CaptchaSessionRepository } from "./repositories/session.reposotory"
import { createSession, getCurrentStage, getSessionFromCookie } from "./services/captcha.service";
import { dirname, join, extname, basename } from "path"
import { fileURLToPath, redis } from "bun";
import { readdir } from "fs/promises"



const app = Fastify({ logger: true })

app.get("/health", async () => {
    return {
        status: "ok"
    }
})

app.get("/captcha", async (request) => {
    const cookieHeader = request.headers.cookie as string | undefined
    const session = await getSessionFromCookie(cookieHeader)
    if (!session) {
        return {
            status: "error",
            message: "Missing session"
        }
    }

    let challenge = await getCurrentStage(session)
    console.log("Challenge generated:", challenge)
    // console.log("Session ID:", sessionId)
    return {
        id: challenge?.id,
        type: challenge?.type,
        status: challenge?.status,
        images: challenge?.images,
        completedAt: challenge?.completedAt
    }
})

app.get("/captcha/challenges/:id", async (request) => {
    const cookieHeader = request.headers.cookie as string | undefined
    const sessionId = await getSessionFromCookie(cookieHeader)
    if (!sessionId) {
        return {
            status: "error",
            message: "Missing session ID"
        }
    }

    console.log("Session ID:", sessionId)
    return {
        status: "ok"
    }
})


app.post("/captcha/sessions", async (request, reply) => {
    const cookieHeader = request.headers.cookie as string | undefined
    const sessionId = await getSessionFromCookie(cookieHeader)
    if (!sessionId) {
        const session = await createSession()
        reply.header("set-cookie", `sessionId=${session.sessionId}; Path=/; HttpOnly;`)
        return {
            session
        }
    }
    return {
        message: "Session already exists"
    }
})


await app.listen({ port: 3000, host: "0.0.0.0" })

