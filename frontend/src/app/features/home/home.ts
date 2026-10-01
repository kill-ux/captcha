// import { Component } from '@angular/core';
// import { Session } from '../../core/services/session';
// import { Router } from '@angular/router';

// @Component({
//     selector: 'app-home',
//     imports: [],
//     templateUrl: './home.html',
//     styleUrl: './home.css',
// })
// export class Home {
//     starting = false;
//     error: string | null = null;

//     constructor(private session: Session, private router: Router) {}

//     async start(): Promise<void> {
//         this.starting = true;
//         this.error = null;
//         try {
//             await this.session.ensureSession();
//             this.router.navigate(['/captcha']);
//         } catch (error) {
//             this.error = 'Could not start a session. Try again.';
//         } finally {
//             this.starting = false
//         }
//     }
// }


import { Component, signal } from '@angular/core';
import { Session } from '../../core/services/session';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [],
    templateUrl: './home.html',
    styleUrl: './home.css',
})
export class Home {
    readonly starting = signal(false);
    readonly error = signal<string | null>(null);

    constructor(private session: Session, private router: Router) {}

    async start(): Promise<void> {
        this.starting.set(true);
        this.error.set(null);
        try {
            await this.session.ensureSession();
            await this.router.navigate(['/captcha']);
        } catch {
            this.error.set('Could not start a session. Try again.');
        } finally {
            this.starting.set(false);
        }
    }
}
