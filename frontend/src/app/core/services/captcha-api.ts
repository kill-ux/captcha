// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { ChallengeResponse, VerifyResponse } from '../models/challenge';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root',
// })
// export class CaptchaApi {
//   constructor(private http: HttpClient) { }

//   startSession(): Observable<any> {
//     return this.http.post('/api/captcha/sessions', {}, { withCredentials: true });
//   }

//   resetSession(): Observable<any> {
//     return this.http.post('/api/captcha/sessions/reset', {}, { withCredentials: true });
//   }

//   getCurrentChallenge(): Observable<ChallengeResponse> {
//     return this.http.get<ChallengeResponse>('/api/captcha', { withCredentials: true });
//   }

//   getImageUrl(imageId: string): string {
//     return `${environment.apiUrl}/api/captcha/images/${imageId}`;
//   }

//   verifyAnswer(challengeId: string, answer: string[] | string): Observable<VerifyResponse> {
//     return this.http.post<VerifyResponse>(
//       '/api/captcha/verify',
//       { challengeId, answer },
//       { withCredentials: true }
//     );
//   }
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Answer, ResultResponse, StageResponse, VerifyResponse } from '../models/challenge';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CaptchaApi {
    constructor(private http: HttpClient) { }

    startSession(): Observable<unknown> {
        return this.http.post('/api/captcha/sessions', {}, { withCredentials: true });
    }

    resetSession(): Observable<unknown> {
        return this.http.post('/api/captcha/sessions/reset', {}, { withCredentials: true });
    }

    getCurrentChallenge(): Observable<StageResponse> {
        return this.http.get<StageResponse>('/api/captcha', { withCredentials: true });
    }

    getStage(stage: number): Observable<StageResponse> {
        return this.http.get<StageResponse>(`/api/captcha/stages/${stage}`, { withCredentials: true });
    }

    getResult(): Observable<ResultResponse> {
        return this.http.get<ResultResponse>('/api/captcha/result', { withCredentials: true });
    }

    getImageUrl(imageId: string): string {
        return `${environment.apiUrl}/api/captcha/images/${imageId}`;
    }

    verifyAnswer(challengeId: string, answer: Answer): Observable<VerifyResponse> {
        return this.http.post<VerifyResponse>(
            '/api/captcha/verify',
            { challengeId, answer },
            { withCredentials: true }
        );
    }
}
