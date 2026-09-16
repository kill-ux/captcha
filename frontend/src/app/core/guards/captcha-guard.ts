import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from '../services/session';

export const challengeGuard: CanActivateFn = (route, state) => {
    const session = inject(Session)
    const router = inject(Router)

    if (!session.completed()) {
        try {
            session.refreshChallenge()
        } catch (error) {
            return router.parseUrl('/')
        }
    }

    if (session.completed()) {
        return true
    }

    return router.parseUrl('/captcha');
};
