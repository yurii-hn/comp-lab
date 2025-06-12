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
import { PIResult } from '@core/types/run.types';
import { AngularSplitModule } from 'angular-split';
import {
  DisplayData,
  IdentifiedConstantDefinition,
  PIInfoPanelStore,
  SplitAreasSizes,
} from 'src/app/components/dashboard/parameters-identification-info-panel/parameters-identification-info-panel.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';
import { ModelInfoComponent } from 'src/app/components/shared/model-info/model-info.component';

@Component({
    selector: 'app-parameters-identification-info-panel',
    imports: [AngularSplitModule, DatatableComponent, ModelInfoComponent],
    providers: [PIInfoPanelStore],
    templateUrl: './parameters-identification-info-panel.component.html',
    styleUrls: ['./parameters-identification-info-panel.component.scss'],
})
export class ParametersIdentificationInfoPanelComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(PIInfoPanelStore);

    public readonly inputData: InputSignal<PIResult | null> =
        input.required<PIResult | null>({
            alias: 'data',
        });

    public readonly displayData: Signal<DisplayData> =
        this.localStore.displayData;

    public readonly identifiedConstantsRowScheme: Signal<
        RowScheme<IdentifiedConstantDefinition>
    > = this.localStore.identifiedConstantsRowScheme;
    public readonly selectedConstantsRowScheme: Signal<
        RowScheme<IdentifiedConstantDefinition>
    > = this.localStore.selectedConstantsRowScheme;
    public readonly dataRowScheme: Signal<RowScheme> =
        this.localStore.dataRowScheme;
    public readonly splitSizes: Signal<SplitAreasSizes> =
        this.localStore.splitAreasSizes;

    public ngOnInit(): void {
        effect(
            (): void => {
                const data: PIResult | null = this.inputData();

                untracked((): void => this.localStore.setData(data));
            },
            {
                injector: this.injector,
            }
        );
    }

    public onGutterDBClick(): void {
        this.localStore.alternateSplitAreasSizes();
    }
}
