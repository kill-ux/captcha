import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { challengeGuard } from './captcha-guard';

describe('challengeGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => challengeGuard(...guardParameters));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
