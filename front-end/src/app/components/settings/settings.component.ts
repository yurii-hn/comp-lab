import {
  Component,
  effect,
  inject,
  Injector,
  OnInit,
  Signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { skip } from 'rxjs';
import {
  FormValue,
  SettingsStore,
} from 'src/app/components/settings/settings.store';
import { SettingsActions } from 'src/app/state/actions/settings.actions';
import {
  Palette,
  PlotYAxisRangeMode,
  Theme,
} from 'src/app/state/reducers/settings.reducer';
import { selectSettingsState } from 'src/app/state/selectors/settings.selectors';

interface PlotYAxisRangeModeOption {
    text: string;
    value: PlotYAxisRangeMode;
}

interface ThemeOption {
    text: string;
    value: Theme;
}

interface PaletteOption {
    text: string;
    value: Palette;
}

@Component({
    selector: 'app-settings',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
    ],
    providers: [SettingsStore],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(SettingsStore);
    private readonly dialogRef: MatDialogRef<SettingsComponent, void> = inject(
        MatDialogRef<SettingsComponent, void>
    );

    public readonly control: FormGroup = new FormGroup({
        app: new FormGroup({
            theme: new FormControl<Theme>(Theme.System),
            palette: new FormControl<Palette>(Palette.Cyan),
        }),
        dashboard: new FormGroup({
            yAxisRangeMode: new FormControl<PlotYAxisRangeMode>(
                PlotYAxisRangeMode.Normal
            ),
        }),
    });

    public readonly yAxisRangeModes: PlotYAxisRangeModeOption[] = [
        {
            text: 'Normal',
            value: PlotYAxisRangeMode.Normal,
        },
        {
            text: 'To Zero',
            value: PlotYAxisRangeMode.ToZero,
        },
    ];

    public readonly themes: ThemeOption[] = [
        {
            text: 'Light',
            value: Theme.Light,
        },
        {
            text: 'Dark',
            value: Theme.Dark,
        },
        {
            text: 'System',
            value: Theme.System,
        },
    ];

    public readonly palettes: PaletteOption[] = [
        {
            text: 'Red',
            value: Palette.Red,
        },
        {
            text: 'Green',
            value: Palette.Green,
        },
        {
            text: 'Blue',
            value: Palette.Blue,
        },
        {
            text: 'Yellow',
            value: Palette.Yellow,
        },
        {
            text: 'Cyan',
            value: Palette.Cyan,
        },
        {
            text: 'Magenta',
            value: Palette.Magenta,
        },
        {
            text: 'Orange',
            value: Palette.Orange,
        },
        {
            text: 'Chartreuse',
            value: Palette.Chartreuse,
        },
        {
            text: 'Spring Green',
            value: Palette.SpringGreen,
        },
        {
            text: 'Azure',
            value: Palette.Azure,
        },
        {
            text: 'Violet',
            value: Palette.Violet,
        },
        {
            text: 'Rose',
            value: Palette.Rose,
        },
    ];

    public ngOnInit(): void {
        const valueChanges: Signal<FormValue | undefined> = toSignal(
            this.control.valueChanges.pipe(skip(1)),
            {
                injector: this.injector,
            }
        );

        effect(
            (): void => {
                const change: FormValue | undefined = valueChanges();

                if (change === undefined) {
                    return;
                }

                untracked((): void => this.localStore.setValueFromForm(change));
            },
            {
                injector: this.injector,
            }
        );

        effect(
            (): void => {
                const formValue: FormValue = this.localStore.formValue();

                untracked((): void => this.control.setValue(formValue));
            },
            {
                injector: this.injector,
            }
        );

        this.localStore.setValueFromParent(
            this.store.selectSignal(selectSettingsState)()
        );
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public onSave(): void {
        this.store.dispatch(
            SettingsActions.setSettings({
                settings: this.localStore.value(),
            })
        );

        this.dialogRef.close();
    }
}
