import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextChallenge } from './text-challenge';
import { CaptchaApi } from '../../../../core/services/captcha-api';

describe('TextChallenge', () => {
    let fixture: ComponentFixture<TextChallenge>;
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
            imports: [TextChallenge],
            providers: [{ provide: CaptchaApi, useValue: { getImageUrl: (id: string) => `/img/${id}` } }],
        });
        fixture = TestBed.createComponent(TextChallenge);
        fixture.componentRef.setInput('imageId', 'xyz');
        el = fixture.nativeElement;
        emitted = vi.fn<(value: string) => void>();
        fixture.componentInstance.answer.subscribe(emitted);
        fixture.detectChanges();
    });

    it('shows the challenge image and a labelled input', () => {
        expect(el.querySelector('img')!.getAttribute('src')).toBe('/img/xyz');
        expect(el.querySelector('label[for="text-answer"]')).not.toBeNull();
    });

    it('blocks an empty answer and shows an alert', () => {
        submit();
        expect(emitted).not.toHaveBeenCalled();
        expect(el.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('blocks a whitespace-only answer', () => {
        type('    ');
        submit();
        expect(emitted).not.toHaveBeenCalled();
        expect(el.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('emits the trimmed text', () => {
        type('  aB3dE ');
        submit();
        expect(emitted).toHaveBeenCalledWith('aB3dE');
        expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('submits with the Enter key', () => {
        type('abcde');
        input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
        expect(emitted).toHaveBeenCalledWith('abcde');
    });

    it('does not emit while disabled', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        type('abcde');
        submit();
        expect(emitted).not.toHaveBeenCalled();
    });

    it('shows the accepted answer read-only in review mode', () => {
        fixture.componentRef.setInput('readonly', true);
        fixture.componentRef.setInput('initialAnswer', 'abcde');
        fixture.detectChanges();
        expect(input().value).toBe('abcde');
        expect(input().readOnly).toBe(true);
        expect(submitButton()).toBeNull();
    });
});
