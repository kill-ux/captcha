import Fastify from "fastify"
import { access } from "fs/promises"
import { createSession, getCurrentStage, getSessionFromCookie } from "./services/captcha.service";
import fastifyStatic from "@fastify/static"
import path from "path";



const app = Fastify({ logger: true })

console.log(import.meta.dirname)
app.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "..", "res")
})

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
        images: challenge?.images.map((image) => image.id),
        completedAt: challenge?.completedAt
    }
})

app.get("/captcha/images/:image_id", async (request, reply) => {
    const { image_id } = request.params as { image_id?: string }
    const cookieHeader = request.headers.cookie as string | undefined
    const session = await getSessionFromCookie(cookieHeader)

    if (!session) {
        return reply.code(401).send({
            status: "error",
            message: "Missing session",
        })
    }

    const challenge = await getCurrentStage(session)
    if (!challenge) {
        return reply.code(404).send({
            status: "error",
            message: "No active challenge"
        })
    }

    const image = challenge?.images?.find(item => item.id === image_id)

    if (!image) {
        return reply.code(404).send({
            status: "error",
            message: "Image not found"
        })
    }

    console.log("Requested image:", image_id, image)
    return reply.sendFile(image.path)
})

app.get("/captcha/challenges/:id", async (request, reply) => {
    const cookieHeader = request.headers.cookie as string | undefined
    const sessionId = await getSessionFromCookie(cookieHeader)
    if (!sessionId) {
        return reply.code(401).send({
            status: "error",
            message: "Missing session ID"
        })
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

