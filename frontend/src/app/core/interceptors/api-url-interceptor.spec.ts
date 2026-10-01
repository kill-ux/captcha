// import { TestBed } from '@angular/core/testing';
// import { HttpInterceptorFn } from '@angular/common/http';

// import { apiUrlInterceptor } from './api-url-interceptor';

// describe('apiUrlInterceptor', () => {
//   const interceptor: HttpInterceptorFn = (req, next) =>
//     TestBed.runInInjectionContext(() => apiUrlInterceptor(req, next));

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//   });

//   it('should be created', () => {
//     expect(interceptor).toBeTruthy();
//   });
// });

import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiUrlInterceptor } from './api-url-interceptor';
import { environment } from '../../../environments/environment';

describe('apiUrlInterceptor', () => {
    let client: HttpClient;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([apiUrlInterceptor])),
                provideHttpClientTesting(),
            ],
        });
        client = TestBed.inject(HttpClient);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('prefixes /api requests with the API origin', () => {
        client.get('/api/captcha').subscribe();
        http.expectOne(`${environment.apiUrl}/api/captcha`).flush({});
    });

    it('leaves absolute urls untouched', () => {
        client.get('https://example.com/api/x').subscribe();
        http.expectOne('https://example.com/api/x').flush({});
    });

    it('leaves non-API relative urls untouched', () => {
        client.get('/assets/data.json').subscribe();
        http.expectOne('/assets/data.json').flush({});
    });
});
