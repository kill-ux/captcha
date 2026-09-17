import { Component } from '@angular/core';
import { Session } from '../../core/services/session';
import { CaptchaApi } from '../../core/services/captcha-api';
import { Router } from '@angular/router';

@Component({
    selector: 'app-result',
    imports: [],
    templateUrl: './result.html',
    styleUrl: './result.css',
})
export class Result {
    restarting = false;

    constructor(
        public session: Session,
        private api: CaptchaApi,
        private router: Router
    ) { }

    async restart(): Promise<void> {
        this.restarting = true;
        try {
            await this.api.startSession();
            this.session.completed.set(false);
            this.session.currentChallenge.set(null);
            await this.session.ensureSession();
            this.router.navigate(['/captcha']);
        } finally {
            this.restarting = false;
        }
    }
}
