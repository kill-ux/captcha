import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import path from "path"
import { registerSessionPlugin } from "./plugins/session.plugin"
import { healthRoutes } from "./routes/health.routes"
import { sessionRoutes } from "./routes/session.routes"
import { captchaRoutes } from "./routes/captcha.routes"

const app = Fastify({ logger: true })

app.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "..", "res")
})

registerSessionPlugin(app)

app.register(healthRoutes)
app.register(sessionRoutes)
app.register(captchaRoutes)

await app.listen({ port: 3000, host: "0.0.0.0" })

