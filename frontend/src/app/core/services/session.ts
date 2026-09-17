import { Injectable, signal } from '@angular/core';
import { ChallengeResponse } from '../models/challenge';
import { CaptchaApi } from './captcha-api';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class Session {
    currentChallenge = signal<ChallengeResponse | null>(null)
    completed = signal(false)
    loading = signal(false)
    error = signal<string | null>(null);

    constructor(private api: CaptchaApi) { }

    async ensureSession(): Promise<void> {
        try {
            await this.refreshChallenge()
        } catch (error) {
            await firstValueFrom(this.api.startSession())
            await this.refreshChallenge()
        }
    }

    async refreshChallenge(): Promise<void> {
        this.loading.set(true)
        this.error.set(null)
        try {
            const res = await firstValueFrom(this.api.getCurrentChallenge())
            if (res.status === 'completed') {
                this.completed.set(true);
                this.currentChallenge.set(null);
            } else {
                this.completed.set(false);
                this.currentChallenge.set(res);
            }
        } catch (e) {
            this.error.set('Failed to load challenge');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async submitAnswer(challengeId: string, answer: string[] | string): Promise<'correct' | 'incorrect'> {
        const res = await firstValueFrom(this.api.verifyAnswer(challengeId, answer))
        if (res.status == 'correct') {
            console.log(res)
            if (res.completed) {
                this.completed.set(true);
                this.currentChallenge.set(null);
            } else {
                await this.refreshChallenge();
            }
            return 'correct'
        }
        return 'incorrect'
    }
}
