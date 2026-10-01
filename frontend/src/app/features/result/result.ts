import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CHALLENGE_LABELS } from '../../core/models/challenge';
import { Session } from '../../core/services/session';

@Component({
    selector: 'app-result',
    imports: [RouterLink],
    templateUrl: './result.html',
    styleUrl: './result.css',
})
export class Result {
    readonly session = inject(Session);
    private readonly router = inject(Router);

    readonly labels = CHALLENGE_LABELS;
    readonly restarting = signal(false);
    readonly error = signal<string | null>(null);

    readonly result = this.session.result;
    readonly duration = computed(() => {
        const ms = this.result()?.durationMs ?? 0;
        const seconds = Math.round(ms / 1000);
        return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    });

    async restart(): Promise<void> {
        this.restarting.set(true);
        this.error.set(null);
        try {
            await this.session.restart();
            await this.router.navigate(['/captcha']);
        } catch {
            this.error.set('Could not restart. Try again.');
        } finally {
            this.restarting.set(false);
        }
    }
}
