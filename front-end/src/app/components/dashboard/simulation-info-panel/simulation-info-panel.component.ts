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
import { SimulationResult } from '@core/types/run.types';
import { AngularSplitModule } from 'angular-split';
import {
  DisplayData,
  SimulationInfoPanelStore,
  SplitAreasSizes,
} from 'src/app/components/dashboard/simulation-info-panel/simulation-info-panel.store';
import { ModelInfoComponent } from 'src/app/components/shared/model-info/model-info.component';

@Component({
    selector: 'app-simulation-info-panel',
    imports: [AngularSplitModule, ModelInfoComponent],
    providers: [SimulationInfoPanelStore],
    templateUrl: './simulation-info-panel.component.html',
    styleUrls: ['./simulation-info-panel.component.scss'],
})
export class SimulationInfoPanelComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(SimulationInfoPanelStore);

    public readonly inputData: InputSignal<SimulationResult | null> =
        input.required({
            alias: 'data',
        });

    public readonly displayData: Signal<DisplayData> =
        this.localStore.displayData;
    public readonly splitSizes: Signal<SplitAreasSizes> =
        this.localStore.splitAreasSizes;

    public ngOnInit(): void {
        effect(
            (): void => {
                const data: SimulationResult | null = this.inputData();

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
