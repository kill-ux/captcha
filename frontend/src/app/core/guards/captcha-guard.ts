import { CanActivateFn } from '@angular/router';

export const captchaGuard: CanActivateFn = (route, state) => {
    return true;
};
