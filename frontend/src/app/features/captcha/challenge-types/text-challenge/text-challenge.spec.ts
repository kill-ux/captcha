import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextChallenge } from './text-challenge';

describe('TextChallenge', () => {
    let component: TextChallenge;
    let fixture: ComponentFixture<TextChallenge>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TextChallenge],
        }).compileComponents();

        fixture = TestBed.createComponent(TextChallenge);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
