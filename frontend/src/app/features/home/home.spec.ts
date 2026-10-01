// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { Home } from './home';

// describe('Home', () => {
//     let component: Home;
//     let fixture: ComponentFixture<Home>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [Home],
//         }).compileComponents();

//         fixture = TestBed.createComponent(Home);
//         component = fixture.componentInstance;
//         await fixture.whenStable();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });


import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Home } from './home';
import { Session } from '../../core/services/session';

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('Home', () => {
    const session = { ensureSession: vi.fn() };
    let navigate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        session.ensureSession.mockReset();
        TestBed.configureTestingModule({
            imports: [Home],
            providers: [provideRouter([]), { provide: Session, useValue: session }],
        });
        navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    });

    function render() {
        const fixture = TestBed.createComponent(Home);
        fixture.detectChanges();
        return fixture;
    }

    it('introduces the app', () => {
        const el: HTMLElement = render().nativeElement;
        expect(el.querySelector('h1')?.textContent).toContain('Angul');
        expect(el.querySelector('main')).not.toBeNull();
    });

    it('starts a session and opens the challenge', async () => {
        session.ensureSession.mockResolvedValue(true);
        const fixture = render();
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await flush();
        expect(session.ensureSession).toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith(['/captcha']);
    });

    it('shows an error and stays on the page when the session cannot be created', async () => {
        session.ensureSession.mockRejectedValue(new Error('down'));
        const fixture = render();
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        await flush();
        fixture.detectChanges();
        expect(navigate).not.toHaveBeenCalled();
        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Could not start');
    });
});
