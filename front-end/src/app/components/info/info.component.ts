import { Component, inject, Signal } from '@angular/core';
import { InfoStore } from 'src/app/components/info/info.store';
import { EquationDisplayComponent } from 'src/app/components/shared/equation-display/equation-display.component';

@Component({
    selector: 'app-info',
    imports: [EquationDisplayComponent],
    providers: [InfoStore],
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.scss'],
})
export class InfoComponent {
    private readonly localStore = inject(InfoStore);

    public readonly compartmentsExpressions: Signal<string[]> =
        this.localStore.compartmentsExpressions;
    public readonly constantsExpressions: Signal<string[]> =
        this.localStore.constantsExpressions;
    public readonly interventionsExpressions: Signal<string[]> =
        this.localStore.interventionsExpressions;
}
