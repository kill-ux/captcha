import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSelectionChallenge } from './image-selection-challenge';

describe('ImageSelectionChallenge', () => {
    let component: ImageSelectionChallenge;
    let fixture: ComponentFixture<ImageSelectionChallenge>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ImageSelectionChallenge],
        }).compileComponents();

        fixture = TestBed.createComponent(ImageSelectionChallenge);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
