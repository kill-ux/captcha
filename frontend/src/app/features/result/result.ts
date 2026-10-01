// import { Component } from '@angular/core';
// import { Session } from '../../core/services/session';
// import { CaptchaApi } from '../../core/services/captcha-api';
// import { Router } from '@angular/router';
// import { firstValueFrom } from 'rxjs';

// @Component({
//     selector: 'app-result',
//     imports: [],
//     templateUrl: './result.html',
//     styleUrl: './result.css',
// })
// export class Result {
//     restarting = false;

//     constructor(
//         public session: Session,
//         private api: CaptchaApi,
//         private router: Router
//     ) { }

//     async restart(): Promise<void> {
//         this.restarting = true;
//         try {
//             await firstValueFrom(this.api.resetSession());
//             this.session.completed.set(false);
//             this.session.currentChallenge.set(null);
//             await this.session.refreshChallenge();
//             this.router.navigate(['/captcha']);
//         } finally {
//             this.restarting = false;
//         }
//     }
// }


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
