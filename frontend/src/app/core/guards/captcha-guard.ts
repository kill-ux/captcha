import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from '../services/session';

/**
 * Protects /result. Access is decided by the server (GET /api/captcha/result answers 403 until
 * every stage is solved), so it can't be bypassed by editing client state. Anyone who fails the
 * check is sent back to their current challenge.
 */
export const challengeGuard: CanActivateFn = async () => {
    const session = inject(Session)
    const router = inject(Router)

    try {
        await session.loadResult()
        return true
    } catch {
        return router.parseUrl('/captcha')
    }
};

/** /captcha -> /captcha/<current stage> (or /result when everything is solved). Also resumes after a refresh. */
export const currentStageGuard: CanActivateFn = async () => {
    const session = inject(Session)
    const router = inject(Router)

    try {
        await session.ensureSession()
    } catch {
        return true // let the page render, it shows the error state
    }

    const progress = session.progress()
    if (!progress) return true
    return progress.completed
        ? router.createUrlTree(['/result'])
        : router.createUrlTree(['/captcha', progress.currentStage])
};
