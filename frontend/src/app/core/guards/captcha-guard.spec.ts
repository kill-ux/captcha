// import { TestBed } from '@angular/core/testing';
// import { CanActivateFn } from '@angular/router';

// import { challengeGuard } from './captcha-guard';

// describe('challengeGuard', () => {
//     const executeGuard: CanActivateFn = (...guardParameters) =>
//         TestBed.runInInjectionContext(() => challengeGuard(...guardParameters));

//     beforeEach(() => {
//         TestBed.configureTestingModule({});
//     });

//     it('should be created', () => {
//         expect(executeGuard).toBeTruthy();
//     });
// });


import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { challengeGuard, currentStageGuard } from './captcha-guard';
import { Session } from '../services/session';
import { Progress } from '../models/challenge';

describe('captcha guards', () => {
    const progress = signal<Progress | null>(null);
    const session = {
        loadResult: vi.fn(),
        ensureSession: vi.fn(),
        progress,
    };
    let router: Router;

    const run = (guard: CanActivateFn) =>
        TestBed.runInInjectionContext(() => guard({} as never, {} as never));
    const url = (tree: unknown) => router.serializeUrl(tree as UrlTree);

    beforeEach(() => {
        session.loadResult.mockReset();
        session.ensureSession.mockReset();
        progress.set(null);
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: Session, useValue: session }],
        });
        router = TestBed.inject(Router);
    });

    describe('challengeGuard (/result)', () => {
        it('lets the user in when the server confirms completion', async () => {
            session.loadResult.mockResolvedValue({});
            await expect(run(challengeGuard)).resolves.toBe(true);
        });

        it('redirects to the current challenge when the server refuses (403/401)', async () => {
            session.loadResult.mockRejectedValue(new Error('403'));
            expect(url(await run(challengeGuard))).toBe('/captcha');
        });
    });

    describe('currentStageGuard (/captcha)', () => {
        it('redirects to the current stage', async () => {
            session.ensureSession.mockResolvedValue(true);
            progress.set({ currentStage: 2, totalStages: 3, completed: false });
            expect(url(await run(currentStageGuard))).toBe('/captcha/2');
        });

        it('redirects to the results once everything is solved', async () => {
            session.ensureSession.mockResolvedValue(true);
            progress.set({ currentStage: 3, totalStages: 3, completed: true });
            expect(url(await run(currentStageGuard))).toBe('/result');
        });

        it('lets the page render (and show its error) when the API is unreachable', async () => {
            session.ensureSession.mockRejectedValue(new Error('down'));
            await expect(run(currentStageGuard)).resolves.toBe(true);
        });
    });
});
