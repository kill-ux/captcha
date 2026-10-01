import { FormControl } from '@angular/forms';
import { notBlank } from './validators';

describe('notBlank', () => {
    const run = (value: string | null) => notBlank(new FormControl(value));

    it('flags whitespace-only values', () => {
        expect(run('   ')).toEqual({ blank: true });
        expect(run('\t\n')).toEqual({ blank: true });
    });

    it('accepts real text (even with surrounding spaces)', () => {
        expect(run('abc')).toBeNull();
        expect(run(' a ')).toBeNull();
    });

    it('leaves empty values to Validators.required', () => {
        expect(run('')).toBeNull();
        expect(run(null)).toBeNull();
    });
});
