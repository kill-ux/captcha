import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import cors from "@fastify/cors"
import path from "path"
import { registerSessionPlugin } from "./plugins/session.plugin"
import { healthRoutes } from "./routes/health.routes"
import { sessionRoutes } from "./routes/session.routes"
import { captchaRoutes } from "./routes/captcha.routes"

export type BuildOptions = {
    logger?: boolean
    /** Folder holding the challenge images. Defaults to ../res. */
    staticRoot?: string
}

export function buildApp(options: BuildOptions = {}) {
    const app = Fastify({ logger: options.logger ?? true })

    app.register(cors, {
        origin: "http://localhost:4200",
        credentials: true,
        methods: "*",
        allowedHeaders: ["Content-Type"]
    })

    // serve: false -> no public wildcard route. Files are only reachable through
    // reply.sendFile() in an authenticated route, so /typing/<answer>.png can't be requested directly.
    app.register(fastifyStatic, {
        root: options.staticRoot ?? path.join(import.meta.dirname, "..", "res"),
        serve: false
    })

    registerSessionPlugin(app)

    app.register(healthRoutes, { prefix: "/api" })
    app.register(sessionRoutes, { prefix: "/api" })
    app.register(captchaRoutes, { prefix: "/api" })

    return app
}
