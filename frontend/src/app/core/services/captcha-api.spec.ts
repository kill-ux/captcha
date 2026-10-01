// import { TestBed } from '@angular/core/testing';

// import { CaptchaApi } from './captcha-api';

// describe('CaptchaApi', () => {
//   let service: CaptchaApi;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(CaptchaApi);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });


import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CaptchaApi } from './captcha-api';
import { environment } from '../../../environments/environment';

describe('CaptchaApi', () => {
    let api: CaptchaApi;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        api = TestBed.inject(CaptchaApi);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('gets the current challenge with the session cookie', () => {
        api.getCurrentChallenge().subscribe();
        const req = http.expectOne('/api/captcha');
        expect(req.request.method).toBe('GET');
        expect(req.request.withCredentials).toBe(true);
        req.flush({});
    });

    it('gets a given stage', () => {
        api.getStage(2).subscribe();
        const req = http.expectOne('/api/captcha/stages/2');
        expect(req.request.withCredentials).toBe(true);
        req.flush({});
    });

    it('gets the result', () => {
        api.getResult().subscribe();
        http.expectOne('/api/captcha/result').flush({});
    });

    it('posts the answer to verify', () => {
        api.verifyAnswer('c1', ['a', 'b']).subscribe();
        const req = http.expectOne('/api/captcha/verify');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ challengeId: 'c1', answer: ['a', 'b'] });
        expect(req.request.withCredentials).toBe(true);
        req.flush({ status: 'correct' });
    });

    it('starts and resets sessions', () => {
        api.startSession().subscribe();
        api.resetSession().subscribe();
        http.expectOne('/api/captcha/sessions').flush({});
        http.expectOne('/api/captcha/sessions/reset').flush({});
    });

    it('builds image urls on the API origin', () => {
        expect(api.getImageUrl('abc')).toBe(`${environment.apiUrl}/api/captcha/images/abc`);
    });
});
