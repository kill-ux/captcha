import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MathChallenge } from './math-challenge';

describe('MathChallenge', () => {
    let component: MathChallenge;
    let fixture: ComponentFixture<MathChallenge>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MathChallenge],
        }).compileComponents();

        fixture = TestBed.createComponent(MathChallenge);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
