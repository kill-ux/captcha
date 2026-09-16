import { TestBed } from '@angular/core/testing';

import { CaptchaApi } from './captcha-api';

describe('CaptchaApi', () => {
  let service: CaptchaApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaptchaApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
