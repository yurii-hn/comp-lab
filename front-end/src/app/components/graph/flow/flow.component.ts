import {
  Component,
  computed,
  inject,
  input,
  InputSignal,
  Signal,
  untracked,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MATH_JS } from '@core/injection-tokens';
import { Flow } from '@core/types/model.types';
import { EquationDisplayComponent } from 'src/app/components/shared/equation-display/equation-display.component';

@Component({
    selector: 'app-flow',
    imports: [MatTooltipModule, EquationDisplayComponent],
    templateUrl: './flow.component.html',
    styleUrls: ['./flow.component.scss'],
})
export class FlowComponent {
    private readonly mathJs = inject(MATH_JS);

    public readonly data: InputSignal<Flow> = input.required();

    public readonly displayEquation: Signal<string> = computed((): string => {
        const equation: string = this.data().equation;

        return untracked((): string => {
            return this.mathJs.parse(equation).toTex();
        });
    });
}
