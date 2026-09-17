import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaptchaApi } from '../../../../core/services/captcha-api';

@Component({
    selector: 'app-text-challenge',
    imports: [ReactiveFormsModule],
    templateUrl: './text-challenge.html',
    styleUrl: './text-challenge.css',
})
export class TextChallenge {
    imageId = input<string>()
    disabled = input(false)
    answer = output<string>()


    answerControl = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
    })

    constructor(private api: CaptchaApi) { }

    get imageUrl(): string {
        const id = this.imageId()
        return id ? this.api.getImageUrl(id) : '';
    }

    submit(): void {
        if (this.answerControl.invalid) {
            this.answerControl.markAsTouched();
            return;
        }
        this.answer.emit(this.answerControl.value.trim());
        this.answerControl.reset('');
    }
}
