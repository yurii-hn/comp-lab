import {
  Component,
  effect,
  inject,
  Injector,
  input,
  InputSignal,
  OnInit,
  Signal,
  untracked,
} from '@angular/core';
import { Model } from '@core/types/model.types';
import { EquationDisplayComponent } from 'src/app/components/shared/equation-display/equation-display.component';
import { InfoStore } from 'src/app/components/shared/model-info/model-info.store';

@Component({
    selector: 'app-model-info',
    imports: [EquationDisplayComponent],
    providers: [InfoStore],
    templateUrl: './model-info.component.html',
    styleUrls: ['./model-info.component.scss'],
})
export class ModelInfoComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(InfoStore);

    public readonly model: InputSignal<Model | null> = input.required();

    public readonly compartmentsExpressions: Signal<string[]> =
        this.localStore.compartmentsExpressions;
    public readonly constantsExpressions: Signal<string[]> =
        this.localStore.constantsExpressions;
    public readonly interventionsExpressions: Signal<string[]> =
        this.localStore.interventionsExpressions;

    public ngOnInit(): void {
        effect(
            (): void => {
                const model: Model | null = this.model();

                untracked((): void => this.localStore.setModel(model));
            },
            {
                injector: this.injector,
            },
        );
    }
}
