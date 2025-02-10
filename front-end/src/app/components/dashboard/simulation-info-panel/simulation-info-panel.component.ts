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
import { SimulationData } from '@core/types/run.types';
import {
  DisplayData,
  SimulationInfoPanelStore,
} from 'src/app/components/dashboard/simulation-info-panel/simulation-info-panel.store';

@Component({
    selector: 'app-simulation-info-panel',
    providers: [SimulationInfoPanelStore],
    templateUrl: './simulation-info-panel.component.html',
    styleUrls: ['./simulation-info-panel.component.scss'],
})
export class SimulationInfoPanelComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(SimulationInfoPanelStore);

    public readonly inputData: InputSignal<SimulationData | null> =
        input.required({
            alias: 'data',
        });

    public readonly displayData: Signal<DisplayData> =
        this.localStore.displayData;

    public ngOnInit(): void {
        effect(
            (): void => {
                const data: SimulationData | null = this.inputData();

                untracked((): void => this.localStore.setData(data));
            },
            {
                injector: this.injector,
            },
        );
    }
}
