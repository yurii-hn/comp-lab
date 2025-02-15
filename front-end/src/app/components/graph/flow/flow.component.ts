import { Component, input, InputSignal } from '@angular/core';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipModule,
} from '@angular/material/tooltip';
import { TOOLTIP_DEFAULT_OPTIONS } from '@core/constants';
import { Flow } from '@core/types/model.types';

@Component({
    selector: 'app-flow',
    imports: [MatTooltipModule],
    providers: [
        {
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
            useValue: TOOLTIP_DEFAULT_OPTIONS,
        },
    ],
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.scss'],
    host: {
        '[style.max-width.px]': 'maxWidth()',
    },
})
export class FlowComponent {
    public readonly maxWidth: InputSignal<number | undefined> = input();

    public readonly data: InputSignal<Flow> = input.required();
}
