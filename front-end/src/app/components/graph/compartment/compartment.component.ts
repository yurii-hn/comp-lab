import { DecimalPipe } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import { Compartment } from '@core/types/model.types';

@Component({
    selector: 'app-compartment',
    imports: [DecimalPipe],
    templateUrl: './compartment.component.html',
    styleUrls: ['./compartment.component.scss'],
    host: {
        '[class.selected]': 'selected()',
    },
})
export class CompartmentComponent {
    public readonly selected: InputSignal<boolean | undefined> = input();

    public readonly data: InputSignal<Compartment> = input.required();
}
