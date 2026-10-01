// import { Component, input, output } from '@angular/core';
// import { CaptchaApi } from '../../../../core/services/captcha-api';
// import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

// @Component({
//     selector: 'app-math-challenge',
//     imports: [ReactiveFormsModule],
//     templateUrl: './math-challenge.html',
//     styleUrl: './math-challenge.css',
// })
// export class MathChallenge {
//     imageId = input<string>()
//     disabled = input(false)
//     answer = output<string>()

//     answerControl = new FormControl('', {
//         nonNullable: true,
//         validators: [Validators.required, Validators.pattern(/^-?\d+$/)]
//     })

//     constructor(private api: CaptchaApi) { }


//     get imageUrl(): string {
//         const id = this.imageId()
//         return id ? this.api.getImageUrl(id) : '';
//     }

//     submit(): void {
//         if (this.answerControl.invalid) {
//             this.answerControl.markAsUntouched()
//             return
//         }
//         this.answer.emit(this.answerControl.value.trim());
//         this.answerControl.reset();
//     }
// }


import { Component, effect, input, output } from '@angular/core';
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
    /** Review mode for an already solved stage: no editing, no submit. */
    readonly = input(false)
    initialAnswer = input<string>()
    answer = output<string>()

    answerControl = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\s*-?\d+\s*$/)]
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
        const errors = this.answerControl.errors
        if (!errors || !this.answerControl.touched) return null
        return errors['required'] ? 'Enter your answer' : 'Enter a whole number'
    }

    submit(): void {
        if (this.disabled() || this.readonly()) return
        if (this.answerControl.invalid) {
            this.answerControl.markAsTouched()
            return
        }
        this.answer.emit(this.answerControl.value.trim());
    }
}
