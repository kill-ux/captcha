// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { MathChallenge } from './math-challenge';

// describe('MathChallenge', () => {
//     let component: MathChallenge;
//     let fixture: ComponentFixture<MathChallenge>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [MathChallenge],
//         }).compileComponents();

//         fixture = TestBed.createComponent(MathChallenge);
//         component = fixture.componentInstance;
//         await fixture.whenStable();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MathChallenge } from './math-challenge';
import { CaptchaApi } from '../../../../core/services/captcha-api';

describe('MathChallenge', () => {
    let fixture: ComponentFixture<MathChallenge>;
    let el: HTMLElement;
    let emitted: ReturnType<typeof vi.fn<(value: string) => void>>;

    const input = () => el.querySelector('input') as HTMLInputElement;
    const submitButton = () => el.querySelector('button') as HTMLButtonElement | null;
    const type = (value: string) => {
        input().value = value;
        input().dispatchEvent(new Event('input'));
        fixture.detectChanges();
    };
    const submit = () => {
        submitButton()!.click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MathChallenge],
            providers: [{ provide: CaptchaApi, useValue: { getImageUrl: (id: string) => `/img/${id}` } }],
        });
        fixture = TestBed.createComponent(MathChallenge);
        fixture.componentRef.setInput('imageId', 'abc');
        el = fixture.nativeElement;
        emitted = vi.fn<(value: string) => void>();
        fixture.componentInstance.answer.subscribe(emitted);
        fixture.detectChanges();
    });

    it('shows the challenge image and a labelled input', () => {
        expect(el.querySelector('img')!.getAttribute('src')).toBe('/img/abc');
        expect(el.querySelector('label[for="math-answer"]')).not.toBeNull();
    });

    it('blocks an empty answer and shows an alert', () => {
        submit();
        expect(emitted).not.toHaveBeenCalled();
        expect(el.querySelector('[role="alert"]')?.textContent).toContain('Enter your answer');
        expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('rejects non-numeric input', () => {
        type('abc');
        submit();
        expect(emitted).not.toHaveBeenCalled();
        expect(el.querySelector('[role="alert"]')?.textContent).toContain('whole number');
    });

    it('accepts negative numbers and emits the trimmed value', () => {
        type(' -4 ');
        submit();
        expect(emitted).toHaveBeenCalledWith('-4');
        expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('submits with the Enter key', () => {
        type('12');
        input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
        expect(emitted).toHaveBeenCalledWith('12');
    });

    it('does not emit while disabled', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        type('12');
        submit();
        expect(emitted).not.toHaveBeenCalled();
    });

    it('shows the accepted answer read-only in review mode', () => {
        fixture.componentRef.setInput('readonly', true);
        fixture.componentRef.setInput('initialAnswer', '12');
        fixture.detectChanges();
        expect(input().value).toBe('12');
        expect(input().readOnly).toBe(true);
        expect(submitButton()).toBeNull();
    });
});
