import { Signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

const DEFINITION_NAME_REGEX: RegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function definitionName(
    existingSymbols: Signal<string[]>,
    initialName?: string | null,
): ValidatorFn {
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

export function dataRow(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const timeControl: FormControl<number> = (control as FormGroup)
            .controls['t'] as FormControl<number>;
        const value: Record<string, number> = structuredClone(control.value);

        if (timeControl.enabled && !value['t']) {
            return { missingTime: true };
        }

        delete value['t'];

        return Object.values(value).some((value: number): boolean => {
            if (!value) {
                return false;
            }

            return true;
        })
            ? null
            : { missingValues: true };
    };
}
