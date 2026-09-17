import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChallengeResponse, VerifyResponse } from '../models/challenge';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CaptchaApi {
  constructor(private http: HttpClient) { }

  startSession(): Observable<any> {
    return this.http.post('/api/captcha/sessions', {}, { withCredentials: true });
  }

  getCurrentChallenge(): Observable<ChallengeResponse> {
    return this.http.get<ChallengeResponse>('/api/captcha', { withCredentials: true });
  }

  getImageUrl(imageId: string): string {
    return `${environment.apiUrl}/api/captcha/images/${imageId}`;
  }

  verifyAnswer(challengeId: string, answer: string[] | string): Observable<VerifyResponse> {
    return this.http.post<VerifyResponse>(
      '/api/captcha/verify',
      { challengeId, answer },
      { withCredentials: true }
    );
  }
}
