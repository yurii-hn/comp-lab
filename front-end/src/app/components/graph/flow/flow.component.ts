import { Component, input, InputSignal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Flow } from '@core/types/model.types';

@Component({
    selector: 'app-flow',
    imports: [MatTooltipModule],
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
