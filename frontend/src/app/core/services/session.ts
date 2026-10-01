import { computed, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Answer, ChallengeView, Progress, ResultResponse, StageResponse, VerifyResponse } from '../models/challenge';
import { CaptchaApi } from './captcha-api';

function hasStatus(error: unknown, ...statuses: number[]): boolean {
    return error instanceof HttpErrorResponse && statuses.includes(error.status);
}

/**
 * Client-side state for the running challenge.
 *
 * The source of truth is the server session (Redis + HttpOnly cookie), so progress survives a page
 * refresh: after a reload this service is empty, and the first `ensureSession()` call rebuilds it
 * from the API and resumes at the right stage.
 */
@Injectable({
    providedIn: 'root',
})
export class Session {
    readonly progress = signal<Progress | null>(null)
    /** The stage currently on screen (active, or a solved one opened for review). */
    readonly challenge = signal<ChallengeView | null>(null)
    readonly result = signal<ResultResponse | null>(null)
    readonly loading = signal(false)
    readonly error = signal<string | null>(null)

    readonly completed = computed(() => this.progress()?.completed ?? false)

    /** Incremented per request so a slow, superseded response can't overwrite newer state. */
    private ticket = 0

    constructor(private api: CaptchaApi) { }

    /**
     * Loads a stage (or the current one when omitted), creating a session first if the server
     * doesn't know us (no cookie, or it expired). Resolves to false if a newer request replaced this one.
     */
    async ensureSession(stage?: number): Promise<boolean> {
        try {
            return await this.load(stage)
        } catch (error) {
            if (!hasStatus(error, 401)) throw error
            await firstValueFrom(this.api.startSession())
            return this.load(stage)
        }
    }

    private async load(stage?: number): Promise<boolean> {
        const ticket = ++this.ticket
        this.loading.set(true)
        this.error.set(null)
        try {
            const request: Observable<StageResponse> = stage === undefined
                ? this.api.getCurrentChallenge()
                : this.api.getStage(stage)
            const res = await firstValueFrom(request)
            if (ticket !== this.ticket) return false
            this.progress.set(res.progress)
            this.challenge.set(res.challenge)
            return true
        } catch (error) {
            // 401 (no session yet) and 404 (stage not reachable) are expected; callers handle them.
            if (ticket === this.ticket && !hasStatus(error, 401, 404)) {
                this.error.set('Failed to load challenge')
            }
            throw error
        } finally {
            if (ticket === this.ticket) this.loading.set(false)
        }
    }

    async submitAnswer(challengeId: string, answer: Answer): Promise<VerifyResponse> {
        return firstValueFrom(this.api.verifyAnswer(challengeId, answer))
    }

    /** Fetches the results summary. Rejects (403/401) unless every stage was solved. */
    async loadResult(): Promise<ResultResponse> {
        const result = await firstValueFrom(this.api.getResult())
        this.result.set(result)
        return result
    }

    async restart(): Promise<void> {
        await firstValueFrom(this.api.resetSession())
        this.reset()
    }

    reset(): void {
        this.ticket++
        this.progress.set(null)
        this.challenge.set(null)
        this.result.set(null)
        this.error.set(null)
        this.loading.set(false)
    }
}
