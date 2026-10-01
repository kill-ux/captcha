// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { Captcha } from './captcha';

// describe('Captcha', () => {
//     let component: Captcha;
//     let fixture: ComponentFixture<Captcha>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [Captcha],
//         }).compileComponents();

//         fixture = TestBed.createComponent(Captcha);
//         component = fixture.componentInstance;
//         await fixture.whenStable();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });


import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Captcha } from './captcha';
import { CaptchaApi } from '../../core/services/captcha-api';
import { Session } from '../../core/services/session';
import { ChallengeType, ChallengeView, Progress, StageResponse } from '../../core/models/challenge';

const challenge = (stage: number, over: Partial<ChallengeView> = {}): ChallengeView => ({
    id: `c${stage}`, type: ChallengeType.Text, stage, status: 'active',
    images: [`img${stage}`], attempts: 0, completedAt: null, ...over,
});
const stageResponse = (c: ChallengeView | null, currentStage: number, completed = false): StageResponse => ({
    progress: { currentStage, totalStages: 3, completed } as Progress,
    challenge: c,
});
const httpError = (status: number) => throwError(() => new HttpErrorResponse({ status }));
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('Captcha', () => {
    let api: Record<string, ReturnType<typeof vi.fn>>;
    let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let navigate: ReturnType<typeof vi.spyOn>;

    async function create() {
        const fixture = TestBed.createComponent(Captcha);
        fixture.detectChanges();
        await flush();
        fixture.detectChanges();
        return fixture;
    }
    const button = (el: HTMLElement, text: string) =>
        Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;

    beforeEach(() => {
        api = {
            getCurrentChallenge: vi.fn(),
            getStage: vi.fn(),
            startSession: vi.fn(() => of({})),
            verifyAnswer: vi.fn(),
            getImageUrl: vi.fn((id: string) => `/img/${id}`),
        };
        params = new BehaviorSubject(convertToParamMap({ stage: '2' }));
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: CaptchaApi, useValue: api },
                { provide: ActivatedRoute, useValue: { paramMap: params } },
            ],
        });
        navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    });

    it('loads the stage named in the URL and renders its challenge type', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        const fixture = await create();
        const el: HTMLElement = fixture.nativeElement;

        expect(api['getStage']).toHaveBeenCalledWith(2);
        expect(el.querySelector('app-text-challenge')).not.toBeNull();
        expect(el.textContent).toContain('Stage 2 / 3');
    });

    it('disables Next on the stage being solved, so it cannot be skipped', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        const el: HTMLElement = (await create()).nativeElement;
        expect(button(el, 'Next').disabled).toBe(true);
        expect(button(el, 'Previous').disabled).toBe(false);
    });

    it('lets the user go back to the previous stage', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        const fixture = await create();
        button(fixture.nativeElement, 'Previous').click();
        expect(navigate).toHaveBeenCalledWith(['/captcha', 1]);
    });

    it('disables Previous on the first stage', async () => {
        params.next(convertToParamMap({ stage: '1' }));
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(1), 1)));
        const el: HTMLElement = (await create()).nativeElement;
        expect(button(el, 'Previous').disabled).toBe(true);
    });

    it('opens a solved stage read-only and allows moving forward again', async () => {
        params.next(convertToParamMap({ stage: '1' }));
        api['getStage']!.mockReturnValue(of(stageResponse(
            challenge(1, { status: 'completed', submittedAnswer: 'abcde' }), 3)));
        const fixture = await create();
        const el: HTMLElement = fixture.nativeElement;

        expect(el.textContent).toContain('read-only review');
        expect((el.querySelector('input') as HTMLInputElement).value).toBe('abcde');
        expect(button(el, 'Next').disabled).toBe(false);
        button(el, 'Next').click();
        expect(navigate).toHaveBeenCalledWith(['/captcha', 2]);
    });

    it('only enables the stage pills that are reachable', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        const el: HTMLElement = (await create()).nativeElement;
        const pills = Array.from(el.querySelectorAll<HTMLButtonElement>('nav[aria-label="Stages"] button'));
        expect(pills.map((p) => p.disabled)).toEqual([false, false, true]);
        expect(pills[1]!.getAttribute('aria-current')).toBe('step');
    });

    it('moves to the next stage after a correct answer', async () => {
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        api['verifyAnswer']!.mockReturnValue(of({ status: 'correct', completed: false, nextStage: 3 }));
        const fixture = await create();
        await fixture.componentInstance.onAnswer('abcde');
        expect(api['verifyAnswer']).toHaveBeenCalledWith('c2', 'abcde');
        expect(navigate).toHaveBeenCalledWith(['/captcha', 3]);
    });

    it('goes to the results after the last stage is solved', async () => {
        params.next(convertToParamMap({ stage: '3' }));
        api['getStage']!.mockReturnValue(of(stageResponse(challenge(3), 3)));
        api['verifyAnswer']!.mockReturnValue(of({ status: 'correct', completed: true, nextStage: null }));
        const fixture = await create();
        await fixture.componentInstance.onAnswer('abcde');
        expect(navigate).toHaveBeenCalledWith(['/result']);
    });

    it('shows feedback and loads a freshly issued challenge after a wrong answer', async () => {
        api['getStage']!
            .mockReturnValueOnce(of(stageResponse(challenge(2), 2)))
            .mockReturnValueOnce(of(stageResponse(challenge(2, { id: 'c2-new', attempts: 1 }), 2)));
        api['verifyAnswer']!.mockReturnValue(of({ status: 'incorrect', attempts: 1 }));
        const fixture = await create();
        await fixture.componentInstance.onAnswer('nope');
        fixture.detectChanges();

        expect(fixture.componentInstance.feedback()).toBe('incorrect');
        expect(TestBed.inject(Session).challenge()?.id).toBe('c2-new');
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Incorrect');
        expect(navigate).not.toHaveBeenCalled();
    });

    it('redirects to the real current stage when the URL points to an unreachable one', async () => {
        params.next(convertToParamMap({ stage: '9' }));
        api['getStage']!.mockReturnValue(httpError(404));
        api['getCurrentChallenge']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        await create();
        expect(navigate).toHaveBeenCalledWith(['/captcha', 2], { replaceUrl: true });
    });

    it('treats a non-numeric stage as "current stage"', async () => {
        params.next(convertToParamMap({ stage: 'abc' }));
        api['getCurrentChallenge']!.mockReturnValue(of(stageResponse(challenge(2), 2)));
        await create();
        expect(api['getStage']).not.toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith(['/captcha', 2], { replaceUrl: true });
    });

    it('offers a link to the results on the last stage once completed', async () => {
        params.next(convertToParamMap({ stage: '3' }));
        api['getStage']!.mockReturnValue(of(stageResponse(
            challenge(3, { status: 'completed', submittedAnswer: 'abcde' }), 3, true)));
        const fixture = await create();
        button(fixture.nativeElement, 'Results').click();
        expect(navigate).toHaveBeenCalledWith(['/result']);
    });

    it('shows an error when the API is down', async () => {
        api['getStage']!.mockReturnValue(httpError(500));
        const fixture = await create();
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Failed to load challenge');
    });
});
