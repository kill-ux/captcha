import { Component, input, output } from '@angular/core';
import { CaptchaApi } from '../../../../core/services/captcha-api';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-math-challenge',
    imports: [ReactiveFormsModule],
    templateUrl: './math-challenge.html',
    styleUrl: './math-challenge.css',
})
export class MathChallenge {
    imageId = input<string>()
    disabled = input(false)
    answer = output<string>()

    answerControl = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^-?\d+$/)]
    })

    constructor(private api: CaptchaApi) { }


    get imageUrl(): string {
        const id = this.imageId()
        return id ? this.api.getImageUrl(id) : '';
    }

    submit(): void {
        if (this.answerControl.invalid) {
            this.answerControl.markAsUntouched()
            return
        }
        this.answer.emit(this.answerControl.value.trim());
        this.answerControl.reset();
    }
}
