import { ValidatorFn } from '@angular/forms';

/** Flags values made only of whitespace (empty values are left to Validators.required). */
export const notBlank: ValidatorFn = (control) => {
    const value = control.value;
    return typeof value === 'string' && value.length > 0 && value.trim() === ''
        ? { blank: true }
        : null;
};
