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
import { IdentifiedConstant } from '@core/types/processing';
import { PIData } from '@core/types/run.types';
import { AngularSplitModule } from 'angular-split';
import {
  DisplayData,
  PIInfoPanelStore,
} from 'src/app/components/dashboard/parameters-identification-info-panel/parameters-identification-info-panel.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';

@Component({
    selector: 'app-parameters-identification-info-panel',
    imports: [AngularSplitModule, DatatableComponent],
    providers: [PIInfoPanelStore],
    templateUrl: './parameters-identification-info-panel.component.html',
    styleUrls: ['./parameters-identification-info-panel.component.scss'],
})
export class ParametersIdentificationInfoPanelComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(PIInfoPanelStore);

    public readonly inputData: InputSignal<PIData | null> =
        input.required<PIData | null>({
            alias: 'data',
        });

    public readonly displayData: Signal<DisplayData> =
        this.localStore.displayData;

    public readonly identifiedConstantsRowScheme: Signal<
        RowScheme<IdentifiedConstant>
    > = this.localStore.identifiedConstantsRowScheme;
    public readonly selectedConstantsRowScheme: Signal<
        RowScheme<IdentifiedConstant>
    > = this.localStore.selectedConstantsRowScheme;
    public readonly dataRowScheme: Signal<RowScheme> =
        this.localStore.dataRowScheme;

    public ngOnInit(): void {
        effect(
            (): void => {
                const data: PIData | null = this.inputData();

                untracked((): void => this.localStore.setData(data));
            },
            {
                injector: this.injector,
            },
        );
    }
}
