// import { Component, input, OnChanges, output } from '@angular/core';
// import { CaptchaApi } from '../../../../core/services/captcha-api';

// @Component({
//     selector: 'app-image-selection-challenge',
//     imports: [],
//     templateUrl: './image-selection-challenge.html',
//     styleUrl: './image-selection-challenge.css',
// })
// export class ImageSelectionChallenge implements OnChanges {
//     imageIds = input<string[]>([])
//     disabled = input(false)
//     answer = output<string[]>()

//     selected = new Set<string>()

//     constructor(private api: CaptchaApi) { }

//     ngOnChanges() {
//         this.selected.clear()
//     }

//     imageUrl(id: string): string {
//         return this.api.getImageUrl(id);
//     }

//     isSelected(id: string): boolean {
//         return this.selected.has(id);
//     }

//     toggle(id: string): void {
//         if (this.disabled()) return;
//         if (this.selected.has(id)) {
//             this.selected.delete(id);
//         } else {
//             this.selected.add(id);
//         }
//     }

//     submit(): void {
//         if (this.selected.size === 0) return;
//         this.answer.emit([...this.selected]);
//     }
// }


import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaptchaApi } from '../../../../core/services/captcha-api';

@Component({
    selector: 'app-image-selection-challenge',
    imports: [ReactiveFormsModule],
    templateUrl: './image-selection-challenge.html',
    styleUrl: './image-selection-challenge.css',
})
export class ImageSelectionChallenge {
    imageIds = input<string[]>([])
    /** Accessible name of the grid (the instruction, e.g. "Select all images with cats"). */
    label = input('Image grid')
    disabled = input(false)
    /** Review mode for an already solved stage: no editing, no submit. */
    readonly = input(false)
    initialAnswer = input<string[]>()
    answer = output<string[]>()

    /** The selected image ids. Validators.required rejects an empty selection. */
    selection = new FormControl<string[]>([], {
        nonNullable: true,
        validators: [Validators.required]
    })

    constructor(private api: CaptchaApi) {
        effect(() => {
            const value = this.initialAnswer()
            if (value !== undefined) this.selection.setValue([...value])
        })
    }

    get errorMessage(): string | null {
        return this.selection.invalid && this.selection.touched
            ? 'Select at least one image'
            : null
    }

    imageUrl(id: string): string {
        return this.api.getImageUrl(id);
    }

    isSelected(id: string): boolean {
        return this.selection.value.includes(id);
    }

    toggle(id: string): void {
        if (this.disabled() || this.readonly()) return;
        const current = this.selection.value;
        this.selection.setValue(
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
        this.selection.markAsTouched();
    }

    submit(): void {
        if (this.disabled() || this.readonly()) return;
        if (this.selection.invalid) {
            this.selection.markAsTouched();
            return;
        }
        this.answer.emit([...this.selection.value]);
    }
}
