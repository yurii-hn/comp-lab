import { DecimalPipe } from '@angular/common';
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
import { OptimalControlResult } from '@core/types/run.types';
import { AngularSplitModule } from 'angular-split';
import {
  DisplayData,
  OptimalControlInfoPanelStore,
  SplitAreasSizes,
} from 'src/app/components/dashboard/optimal-control-info-panel/optimal-control-info-panel.store';
import { DatatableComponent } from 'src/app/components/shared/datatable/datatable.component';
import { RowScheme } from 'src/app/components/shared/datatable/datatable.store';
import { EquationDisplayComponent } from 'src/app/components/shared/equation-display/equation-display.component';
import { ModelInfoComponent } from 'src/app/components/shared/model-info/model-info.component';

@Component({
    selector: 'app-optimal-control-info-panel',
    imports: [
        AngularSplitModule,
        DatatableComponent,
        ModelInfoComponent,
        EquationDisplayComponent,
        DecimalPipe,
    ],
    providers: [OptimalControlInfoPanelStore],
    templateUrl: './optimal-control-info-panel.component.html',
    styleUrls: ['./optimal-control-info-panel.component.scss'],
})
export class OptimalControlInfoPanelComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(OptimalControlInfoPanelStore);

    public readonly inputData: InputSignal<OptimalControlResult | null> =
        input.required<OptimalControlResult | null>({
            alias: 'data',
        });

    public readonly displayData: Signal<DisplayData> =
        this.localStore.displayData;

    public interventionsRowScheme: Signal<RowScheme> =
        this.localStore.interventionsRowScheme;
    public boundariesRowScheme: Signal<RowScheme> =
        this.localStore.boundariesRowScheme;
    public readonly splitSizes: Signal<SplitAreasSizes> =
        this.localStore.splitAreasSizes;

    public ngOnInit(): void {
        effect(
            (): void => {
                const data: OptimalControlResult | null = this.inputData();

                untracked((): void => this.localStore.setData(data));
            },
            {
                injector: this.injector,
            },
        );
    }

    public onGutterDBClick(): void {
        this.localStore.alternateSplitAreasSizes();
    }
}
