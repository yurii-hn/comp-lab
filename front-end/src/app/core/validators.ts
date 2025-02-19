import { Signal } from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

const DEFINITION_NAME_REGEX: RegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function uniqueName(existingSymbols: Signal<string[]>): ValidatorFn {
    let initialName: string | null | undefined;

    return (control: AbstractControl): ValidationErrors | null => {
        const name: string | null = control.value;

        if (control.pristine) {
            initialName = name;

            return null;
        }

        if (!name || typeof name !== 'string' || name === initialName) {
            return null;
        }

        return existingSymbols().some(
            (symbol: string): boolean => symbol === name,
        )
            ? { nameExists: true }
            : null;
    };
}

export function definitionName(existingSymbols: Signal<string[]>): ValidatorFn {
    let initialName: string | null | undefined;

    return (control: AbstractControl): ValidationErrors | null => {
        const name: string | null = control.value;

        if (control.pristine) {
            initialName = name;

            return null;
        }

        if (!name || typeof name !== 'string' || name === initialName) {
            return null;
        }

        if (!DEFINITION_NAME_REGEX.test(name)) {
            return { invalidName: true };
        }

        return existingSymbols().some(
            (symbol: string): boolean => symbol === name,
        )
            ? { nameExists: true }
            : null;
    };
}
