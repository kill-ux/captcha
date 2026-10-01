// import { Component, input, output } from '@angular/core';
// import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
// import { CaptchaApi } from '../../../../core/services/captcha-api';

// @Component({
//     selector: 'app-text-challenge',
//     imports: [ReactiveFormsModule],
//     templateUrl: './text-challenge.html',
//     styleUrl: './text-challenge.css',
// })
// export class TextChallenge {
//     imageId = input<string>()
//     disabled = input(false)
//     answer = output<string>()


//     answerControl = new FormControl('', {
//         nonNullable: true,
//         validators: [Validators.required]
//     })

//     constructor(private api: CaptchaApi) { }

//     get imageUrl(): string {
//         const id = this.imageId()
//         return id ? this.api.getImageUrl(id) : '';
//     }

//     submit(): void {
//         if (this.answerControl.invalid) {
//             this.answerControl.markAsTouched();
//             return;
//         }
//         this.answer.emit(this.answerControl.value.trim());
//         this.answerControl.reset('');
//     }
// }


import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaptchaApi } from '../../../../core/services/captcha-api';
import { notBlank } from '../../../../shared/validators';

@Component({
    selector: 'app-text-challenge',
    imports: [ReactiveFormsModule],
    templateUrl: './text-challenge.html',
    styleUrl: './text-challenge.css',
})
export class TextChallenge {
    imageId = input<string>()
    disabled = input(false)
    /** Review mode for an already solved stage: no editing, no submit. */
    readonly = input(false)
    initialAnswer = input<string>()
    answer = output<string>()

    answerControl = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, notBlank]
    })

    constructor(private api: CaptchaApi) {
        effect(() => {
            const value = this.initialAnswer()
            if (value !== undefined) this.answerControl.setValue(value)
        })
    }

    get imageUrl(): string {
        const id = this.imageId()
        return id ? this.api.getImageUrl(id) : '';
    }

    get errorMessage(): string | null {
        return this.answerControl.invalid && this.answerControl.touched
            ? 'Type the characters you see'
            : null
    }

    submit(): void {
        if (this.disabled() || this.readonly()) return
        if (this.answerControl.invalid) {
            this.answerControl.markAsTouched();
            return;
        }
        this.answer.emit(this.answerControl.value.trim());
    }
}
