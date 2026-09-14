import { redis } from "bun"
import type { CaptchaSession } from "../types/types"

const SESSION_TTL_SECONDS = 15 * 60 // 15 minutes

function sessionKey(sessionId: string): string {
    return `captcha-session:${sessionId}`
}

export class CaptchaSessionRepository {
    async save(session: CaptchaSession): Promise<void> {
        await redis.set(
            sessionKey(session.sessionId),
            JSON.stringify(session),
            "EX",
            SESSION_TTL_SECONDS
        )
    }

    async findById(sessionId: string): Promise<CaptchaSession | null> {
        const rawSession = await redis.get(sessionKey(sessionId))
        if (!rawSession) {
            return null
        }

        return JSON.parse(rawSession) as CaptchaSession
    }

    async delete(sessionId: string): Promise<void> {
        await redis.del(sessionKey(sessionId));
    }

    async refresh(sessionId: string): Promise<void> {
        await redis.expire(
            sessionKey(sessionId),
            SESSION_TTL_SECONDS,
        );
    }
}

