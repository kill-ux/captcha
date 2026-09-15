import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CaptchaApi } from './core/services/captcha-api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  constructor(private api: CaptchaApi){
    this.api.startSession().subscribe(res => console.log('session:', res));
  }
}
