import { Component, input, OnChanges, output } from '@angular/core';
import { CaptchaApi } from '../../../../core/services/captcha-api';

@Component({
    selector: 'app-image-selection-challenge',
    imports: [],
    templateUrl: './image-selection-challenge.html',
    styleUrl: './image-selection-challenge.css',
})
export class ImageSelectionChallenge implements OnChanges {
    imageIds = input<string[]>([])
    disabled = input(false)
    answer = output<string[]>()

    selected = new Set<string>()

    constructor(private api: CaptchaApi) { }

    ngOnChanges() {
        this.selected.clear()
    }

    imageUrl(id: string): string {
        return this.api.getImageUrl(id);
    }

    isSelected(id: string): boolean {
        return this.selected.has(id);
    }

    toggle(id: string): void {
        if (this.disabled()) return;
        if (this.selected.has(id)) {
            this.selected.delete(id);
        } else {
            this.selected.add(id);
        }
    }

    submit(): void {
        if (this.selected.size === 0) return;
        this.answer.emit([...this.selected]);
    }
}
