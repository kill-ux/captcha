import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Answer, ChallengeType } from '../../core/models/challenge';
import { Session } from '../../core/services/session';
import { MathChallenge } from "./challenge-types/math-challenge/math-challenge";
import { TextChallenge } from "./challenge-types/text-challenge/text-challenge";
import { ImageSelectionChallenge } from "./challenge-types/image-selection-challenge/image-selection-challenge";

@Component({
    selector: 'app-captcha',
    imports: [MathChallenge, TextChallenge, ImageSelectionChallenge],
    templateUrl: './captcha.html',
    styleUrl: './captcha.css',
})
export class Captcha {
    readonly ChallengeType = ChallengeType;
    readonly session = inject(Session);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly submitting = signal(false);
    readonly feedback = signal<'incorrect' | 'error' | null>(null);

    private stageParam: string | null = null;

    readonly totalStages = computed(() => this.session.progress()?.totalStages ?? 0);
    readonly reachableStage = computed(() => this.session.progress()?.currentStage ?? 0);
    readonly stage = computed(() => this.session.challenge()?.stage ?? 0);
    readonly stages = computed(() => Array.from({ length: this.totalStages() }, (_, i) => i + 1));
    readonly isReview = computed(() => this.session.challenge()?.status === 'completed');
    readonly stageLabel = computed(() => String(this.stage()).padStart(2, '0'));

    /**
     * The challenge as a one-item list. Rendering it through `@for ... track challenge.id` gives
     * each new challenge (next stage, previous stage, or a re-issued one after a wrong answer) a
     * fresh DOM subtree: forms start clean and the enter animation replays.
     */
    readonly visible = computed(() => {
        const challenge = this.session.challenge();
        return challenge ? [challenge] : [];
    });

    readonly canGoBack = computed(() => this.stage() > 1);
    readonly canGoNext = computed(() => this.stage() > 0 && this.stage() < this.reachableStage());
    readonly canViewResults = computed(() => this.session.completed() && this.stage() === this.totalStages());

    constructor() {
        this.route.paramMap
            .pipe(takeUntilDestroyed(inject(DestroyRef)))
            .subscribe((params) => {
                this.stageParam = params.get('stage');
                void this.load();
            });
    }

    isSolved(stage: number): boolean {
        return this.session.completed() || stage < this.reachableStage();
    }

    goTo(stage: number): void {
        if (stage < 1 || stage > this.reachableStage() || this.submitting()) return;
        void this.router.navigate(['/captcha', stage]);
    }

    viewResults(): void {
        void this.router.navigate(['/result']);
    }

    async onAnswer(answer: Answer): Promise<void> {
        const challenge = this.session.challenge();
        if (!challenge || challenge.status !== 'active' || this.submitting()) return;

        this.submitting.set(true);
        this.feedback.set(null);

        try {
            const result = await this.session.submitAnswer(challenge.id, answer);

            if (result.status === 'correct') {
                if (result.completed) {
                    await this.router.navigate(['/result']);
                } else {
                    await this.router.navigate(['/captcha', result.nextStage]);
                }
            } else {
                // The server burns the challenge on a wrong answer: load the freshly issued one.
                this.feedback.set('incorrect');
                await this.session.ensureSession(challenge.stage);
            }
        } catch {
            // e.g. the session expired: reload from the server, then tell the user.
            await this.load();
            this.feedback.set('error');
        } finally {
            this.submitting.set(false);
        }
    }

    private async load(): Promise<void> {
        this.feedback.set(null);
        const raw = this.stageParam;
        const stage = raw === null ? undefined : /^\d+$/.test(raw) ? Number(raw) : NaN;

        try {
            if (stage === undefined || Number.isNaN(stage)) {
                if (await this.session.ensureSession()) await this.goToCurrent();
            } else {
                await this.session.ensureSession(stage);
            }
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                // Stage not reachable (typed by hand, or a new session after expiry): go to the real current stage.
                try {
                    if (await this.session.ensureSession()) await this.goToCurrent();
                } catch { /* session.error is already set */ }
            }
            // other errors: session.error() is displayed by the template
        }
    }

    private async goToCurrent(): Promise<void> {
        const progress = this.session.progress();
        if (!progress) return;
        if (progress.completed) {
            await this.router.navigate(['/result'], { replaceUrl: true });
        } else {
            await this.router.navigate(['/captcha', progress.currentStage], { replaceUrl: true });
        }
    }
}
