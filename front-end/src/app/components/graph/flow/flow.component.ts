import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Flow } from '@core/types/model.types';
import { EquationDisplayComponent } from 'src/app/components/shared/equation-display/equation-display.component';

@Component({
    selector: 'app-flow',
    imports: [MatTooltipModule, EquationDisplayComponent],
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.scss'],
})
export class FlowComponent {
    public readonly data: InputSignal<Flow> = input.required();

    public readonly displayEquation: Signal<string> = computed((): string =>
        this.data().equation.replace(/_/g, '\\_')
    );
}
