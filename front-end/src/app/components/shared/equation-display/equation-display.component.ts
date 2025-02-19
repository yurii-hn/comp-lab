import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  InputSignal,
  untracked,
} from '@angular/core';
import { KATEX } from '@core/injection-tokens';

@Component({
    selector: 'app-equation-display',
    template: '',
    styleUrls: ['./equation-display.component.scss'],
})
export class EquationDisplayComponent implements AfterViewInit {
    private readonly injector: Injector = inject(Injector);
    private readonly katex = inject(KATEX);

    private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

    public readonly equation: InputSignal<string> = input.required();

    public ngAfterViewInit(): void {
        effect(
            (): void => {
                const equation: string = this.equation();
                const hostElement: HTMLElement = this.elementRef.nativeElement;

                untracked((): void =>
                    this.katex.render(equation, hostElement, {
                        output: 'html',
                    }),
                );
            },
            {
                injector: this.injector,
            },
        );
    }
}
