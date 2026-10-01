import { Routes } from '@angular/router';
import { Home } from "./features/home/home"
import { Captcha } from './features/captcha/captcha';
import { Result } from './features/result/result';
import { challengeGuard, currentStageGuard } from './core/guards/captcha-guard';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'captcha', component: Captcha, canActivate: [currentStageGuard] },
    { path: 'captcha/:stage', component: Captcha },
    { path: 'result', component: Result, canActivate: [challengeGuard] },
    { path: '**', redirectTo: '' }
];
