// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { Result } from './result';

// describe('Result', () => {
//     let component: Result;
//     let fixture: ComponentFixture<Result>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [Result],
//         }).compileComponents();

//         fixture = TestBed.createComponent(Result);
//         component = fixture.componentInstance;
//         await fixture.whenStable();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });


import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Result } from './result';
import { CaptchaApi } from '../../core/services/captcha-api';
import { Session } from '../../core/services/session';
import { ChallengeType, ResultResponse } from '../../core/models/challenge';

const flush = () => new Promise((resolve) => setTimeout(resolve));

const summary: ResultResponse = {
    score: 2, totalStages: 3, failedAttempts: 2, startedAt: '', completedAt: '', durationMs: 83_000,
    stages: [
        { stage: 1, type: ChallengeType.Math, attempts: 0, solvedFirstTry: true, completedAt: null },
        { stage: 2, type: ChallengeType.Text, attempts: 1, solvedFirstTry: false, completedAt: null },
        { stage: 3, type: ChallengeType.ImageSelection, attempts: 1, solvedFirstTry: false, completedAt: null },
    ],
};

describe('Result', () => {
    let api: { resetSession: ReturnType<typeof vi.fn> };
    let navigate: ReturnType<typeof vi.spyOn>;
    let session: Session;

    beforeEach(() => {
        api = { resetSession: vi.fn(() => of({})) };
        TestBed.configureTestingModule({
            imports: [Result],
            providers: [provideRouter([]), { provide: CaptchaApi, useValue: api }],
        });
        navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
        session = TestBed.inject(Session);
    });

    function render() {
        const fixture = TestBed.createComponent(Result);
        fixture.detectChanges();
        return fixture;
    }

    it('shows score, retries, time and one row per stage', () => {
        session.result.set(summary);
        const el: HTMLElement = render().nativeElement;

        expect(el.querySelector('dl')!.textContent).toContain('2/3');
        expect(el.querySelector('dl')!.textContent).toContain('1m 23s');

        const rows = Array.from(el.querySelectorAll('tbody tr')).map((r) => r.textContent!.replace(/\s+/g, ' ').trim());
        expect(rows[0]).toContain('Math');
        expect(rows[0]).toContain('First try');
        expect(rows[1]).toContain('Text');
        expect(rows[1]).toContain('1 retry');
    });

    it('links every stage to its read-only review', () => {
        session.result.set(summary);
        const links = Array.from((render().nativeElement as HTMLElement).querySelectorAll('tbody a'));
        expect(links.map((a) => a.getAttribute('href'))).toEqual(['/captcha/1', '/captcha/2', '/captcha/3']);
    });

    it('restarts: resets the server session, clears local state and returns to the challenge', async () => {
        session.result.set(summary);
        const fixture = render();
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await flush();

        expect(api.resetSession).toHaveBeenCalled();
        expect(session.result()).toBeNull();
        expect(navigate).toHaveBeenCalledWith(['/captcha']);
    });

    it('shows an error when the restart fails', async () => {
        session.result.set(summary);
        api.resetSession.mockReturnValue(throwError(() => new Error('down')));
        const fixture = render();
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await flush();
        fixture.detectChanges();

        expect(navigate).not.toHaveBeenCalled();
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Could not restart');
    });
});
