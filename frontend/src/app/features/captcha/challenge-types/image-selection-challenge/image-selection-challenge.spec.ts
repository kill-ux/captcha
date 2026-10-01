// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { ImageSelectionChallenge } from './image-selection-challenge';

// describe('ImageSelectionChallenge', () => {
//     let component: ImageSelectionChallenge;
//     let fixture: ComponentFixture<ImageSelectionChallenge>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [ImageSelectionChallenge],
//         }).compileComponents();

//         fixture = TestBed.createComponent(ImageSelectionChallenge);
//         component = fixture.componentInstance;
//         await fixture.whenStable();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageSelectionChallenge } from './image-selection-challenge';
import { CaptchaApi } from '../../../../core/services/captcha-api';

describe('ImageSelectionChallenge', () => {
    let fixture: ComponentFixture<ImageSelectionChallenge>;
    let el: HTMLElement;
    let emitted: ReturnType<typeof vi.fn<(value: string[]) => void>>;

    const tiles = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="group"] button'));
    const submitButton = () => el.querySelector<HTMLButtonElement>('button:not([role="group"] button)');
    const click = (button: HTMLButtonElement | null) => {
        button!.click();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ImageSelectionChallenge],
            providers: [{ provide: CaptchaApi, useValue: { getImageUrl: (id: string) => `/img/${id}` } }],
        });
        fixture = TestBed.createComponent(ImageSelectionChallenge);
        fixture.componentRef.setInput('imageIds', ['a', 'b', 'c']);
        fixture.componentRef.setInput('label', 'Select all images with cats');
        el = fixture.nativeElement;
        emitted = vi.fn<(value: string[]) => void>();
        fixture.componentInstance.answer.subscribe(emitted);
        fixture.detectChanges();
    });

    it('renders one accessible toggle per image inside a labelled group', () => {
        expect(tiles().length).toBe(3);
        expect(el.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Select all images with cats');
        expect(tiles().every((t) => t.getAttribute('aria-pressed') === 'false')).toBe(true);
        expect(el.querySelectorAll('img')[1]!.getAttribute('src')).toBe('/img/b');
    });

    it('toggles selection and updates aria-pressed and the counter', () => {
        click(tiles()[0]!);
        click(tiles()[2]!);
        expect(tiles().map((t) => t.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true']);
        expect(submitButton()!.textContent).toContain('2 selected');

        click(tiles()[0]!);
        expect(tiles()[0]!.getAttribute('aria-pressed')).toBe('false');
        expect(submitButton()!.textContent).toContain('1 selected');
    });

    it('will not submit an empty selection and explains why', () => {
        click(submitButton());
        expect(emitted).not.toHaveBeenCalled();
        expect(el.querySelector('[role="alert"]')?.textContent).toContain('at least one');
    });

    it('emits the selected ids', () => {
        click(tiles()[1]!);
        click(tiles()[2]!);
        click(submitButton());
        expect(emitted).toHaveBeenCalledWith(['b', 'c']);
    });

    it('ignores clicks while disabled', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        click(tiles()[0]!);
        expect(tiles()[0]!.getAttribute('aria-pressed')).toBe('false');
    });

    it('shows the accepted selection read-only in review mode', () => {
        fixture.componentRef.setInput('readonly', true);
        fixture.componentRef.setInput('initialAnswer', ['a', 'c']);
        fixture.detectChanges();
        expect(tiles().map((t) => t.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true']);
        expect(submitButton()).toBeNull();

        click(tiles()[1]!); // cannot be changed
        expect(tiles()[1]!.getAttribute('aria-pressed')).toBe('false');
    });
});
