import { Component } from '@angular/core';
import { Session } from '../../core/services/session';
import { CaptchaApi } from '../../core/services/captcha-api';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

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
            await firstValueFrom(this.api.resetSession());
            this.session.completed.set(false);
            this.session.currentChallenge.set(null);
            await this.session.refreshChallenge(); 
            this.router.navigate(['/captcha']);
        } finally {
            this.restarting = false;
        }
    }
}
