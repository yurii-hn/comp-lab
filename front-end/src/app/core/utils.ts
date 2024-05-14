import { Observable, Subscriber } from 'rxjs';
import { IValues } from './types/processing';

export function fromResizeObserver(
    target: Element
): Observable<ResizeObserverEntry> {
    return new Observable(
        (subscriber: Subscriber<ResizeObserverEntry>): (() => void) => {
            const resizeObserver = new ResizeObserver(
                (entries: ResizeObserverEntry[]): void => {
                    entries.forEach((entry: ResizeObserverEntry): void => {
                        subscriber.next(entry);
                    });
                }
            );

            resizeObserver.observe(target);

            return (): void => {
                resizeObserver.unobserve(target);
                resizeObserver.disconnect();
            };
        }
    );
}

export function valuesToRowData(values: IValues[]): Record<string, number>[] {
    return Array.from(
        { length: values[0].values.length },
        (_: unknown, index: number): Record<string, number> =>
            values.reduce(
                (
                    row: Record<string, number>,
                    values: IValues
                ): Record<string, number> => ({
                    ...row,
                    [values.name]: values.values[index],
                }),
                {}
            )
    );
}
