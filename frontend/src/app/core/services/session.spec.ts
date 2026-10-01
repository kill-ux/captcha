// import { TestBed } from '@angular/core/testing';

// import { Session } from './session';

// describe('Session', () => {
//   let service: Session;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(Session);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });


import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { Session } from './session';
import { CaptchaApi } from './captcha-api';
import { ChallengeType, StageResponse } from '../models/challenge';

const stageResponse = (stage: number, currentStage = stage, completed = false): StageResponse => ({
    progress: { currentStage, totalStages: 3, completed },
    challenge: {
        id: `c${stage}`, type: ChallengeType.Text, stage, status: 'active',
        images: ['img'], attempts: 0, completedAt: null,
    },
});

const httpError = (status: number) => throwError(() => new HttpErrorResponse({ status }));

describe('Session', () => {
    let api: Record<string, ReturnType<typeof vi.fn>>;
    let session: Session;

    beforeEach(() => {
        api = {
            getCurrentChallenge: vi.fn(),
            getStage: vi.fn(),
            getResult: vi.fn(),
            startSession: vi.fn(() => of({})),
            resetSession: vi.fn(() => of({})),
            verifyAnswer: vi.fn(),
        };
        TestBed.configureTestingModule({ providers: [{ provide: CaptchaApi, useValue: api }] });
        session = TestBed.inject(Session);
    });

    it('loads the current stage into the signals (resume after refresh)', async () => {
        api['getCurrentChallenge']!.mockReturnValue(of(stageResponse(2)));
        await expect(session.ensureSession()).resolves.toBe(true);
        expect(session.challenge()?.stage).toBe(2);
        expect(session.progress()).toEqual({ currentStage: 2, totalStages: 3, completed: false });
        expect(session.completed()).toBe(false);
        expect(session.loading()).toBe(false);
    });

    it('loads a specific stage', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(1, 3)));
        await session.ensureSession(1);
        expect(api['getStage']).toHaveBeenCalledWith(1);
        expect(session.challenge()?.stage).toBe(1);
        expect(session.progress()?.currentStage).toBe(3);
    });

    it('reports completion from the server progress', async () => {
        api['getCurrentChallenge']!.mockReturnValue(of({ progress: { currentStage: 3, totalStages: 3, completed: true }, challenge: null }));
        await session.ensureSession();
        expect(session.completed()).toBe(true);
        expect(session.challenge()).toBeNull();
    });

    it('starts a session when the server answers 401, then retries', async () => {
        api['getCurrentChallenge']!
            .mockReturnValueOnce(httpError(401))
            .mockReturnValueOnce(of(stageResponse(1)));
        await session.ensureSession();
        expect(api['startSession']).toHaveBeenCalledTimes(1);
        expect(session.challenge()?.stage).toBe(1);
        expect(session.error()).toBeNull();
    });

    it('does not start a new session for other failures, and exposes an error', async () => {
        api['getCurrentChallenge']!.mockReturnValue(httpError(500));
        await expect(session.ensureSession()).rejects.toBeInstanceOf(HttpErrorResponse);
        expect(api['startSession']).not.toHaveBeenCalled();
        expect(session.error()).toBe('Failed to load challenge');
        expect(session.loading()).toBe(false);
    });

    it('rejects on 404 without flagging an error (unreachable stage)', async () => {
        api['getStage']!.mockReturnValue(httpError(404));
        await expect(session.ensureSession(3)).rejects.toBeInstanceOf(HttpErrorResponse);
        expect(session.error()).toBeNull();
    });

    it('ignores a slow response that was superseded by a newer request', async () => {
        const slow = new Subject<StageResponse>();
        const fast = new Subject<StageResponse>();
        api['getStage']!.mockReturnValueOnce(slow).mockReturnValueOnce(fast);

        const first = session.ensureSession(1);
        const second = session.ensureSession(2);
        fast.next(stageResponse(2));
        slow.next(stageResponse(1));

        await expect(second).resolves.toBe(true);
        await expect(first).resolves.toBe(false);
        expect(session.challenge()?.stage).toBe(2);
    });

    it('submitAnswer forwards the answer to the API', async () => {
        api['verifyAnswer']!.mockReturnValue(of({ status: 'correct', completed: false, nextStage: 2 }));
        const res = await session.submitAnswer('c1', 'abc');
        expect(api['verifyAnswer']).toHaveBeenCalledWith('c1', 'abc');
        expect(res.status).toBe('correct');
    });

    it('loadResult stores the summary, and rejects when the server refuses (403)', async () => {
        const summary = { score: 3, totalStages: 3, failedAttempts: 0, startedAt: '', completedAt: '', durationMs: 1, stages: [] };
        api['getResult']!.mockReturnValueOnce(of(summary)).mockReturnValueOnce(httpError(403));
        await session.loadResult();
        expect(session.result()).toEqual(summary);
        await expect(session.loadResult()).rejects.toBeInstanceOf(HttpErrorResponse);
    });

    it('restart resets the server session and clears local state', async () => {
        api['getCurrentChallenge']!.mockReturnValue(of(stageResponse(2)));
        await session.ensureSession();
        await session.restart();
        expect(api['resetSession']).toHaveBeenCalled();
        expect(session.progress()).toBeNull();
        expect(session.challenge()).toBeNull();
        expect(session.result()).toBeNull();
    });
});
