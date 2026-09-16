import { Component, OnInit } from '@angular/core';
import { ChallengeType } from '../../core/models/challenge';
import { Session } from '../../core/services/session';
import { Router } from '@angular/router';

@Component({
    selector: 'app-captcha',
    imports: [],
    templateUrl: './captcha.html',
    styleUrl: './captcha.css',
})
export class Captcha implements OnInit {

    ChallengeType = ChallengeType;
    submitting = false;
    feedback: 'correct' | 'incorrect' | null = null;

    constructor(public session: Session, private router: Router) { }

    async ngOnInit(): Promise<void> {
        if (!this.session.currentChallenge() && !this.session.completed()) {
            await this.session.ensureSession();
        }
        if (this.session.completed()) {
            this.router.navigate(['/result']);
        }
    }

    async onAnswer(answer: string[] | string): Promise<void> {
        const challenge = this.session.currentChallenge();
        if (!challenge?.id) return;

        this.submitting = true;
        this.feedback = null;

        try {
            const result = await this.session.submitAnswer(challenge.id, answer);
            this.feedback = result;
            if (result === 'correct' && this.session.completed()) {
                this.router.navigate(['/result']);
            }
        } finally {
            this.submitting = false;
        }
    }

}
