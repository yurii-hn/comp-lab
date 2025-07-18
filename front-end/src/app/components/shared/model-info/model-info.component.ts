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
import {
  ExpressionsGroup,
  InfoStore,
} from 'src/app/components/shared/model-info/model-info.store';

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
    public readonly adjointModel: InputSignal<Record<string, string> | null> =
        input<Record<string, string> | null>({});

    public readonly modelExpressions: Signal<ExpressionsGroup[]> =
        this.localStore.modelExpressions;
    public readonly adjointModelExpressions: Signal<ExpressionsGroup[]> =
        this.localStore.adjointModelExpressions;

    public ngOnInit(): void {
        effect(
            (): void => {
                const model: Model | null = this.model();

                untracked((): void => {
                    this.localStore.setModel(model);
                });
            },
            {
                injector: this.injector,
            },
        );
        effect(
            (): void => {
                const adjointModel: Record<string, string> | null =
                    this.adjointModel();

                untracked((): void => {
                    this.localStore.setAdjointModel(adjointModel);
                });
            },
            {
                injector: this.injector,
            },
        );
    }
}
