import { Observable, Subscriber } from 'rxjs';

import { IOptimalControlResultsBase, IResultsBase } from './interfaces';

export function isOptimalControlResults(
    results: IResultsBase
): results is IOptimalControlResultsBase {
    return (
        Array.isArray(results.data.payload) && results.data.payload.length === 2
    );
}

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

            return () => {
                resizeObserver.unobserve(target);
                resizeObserver.disconnect();
            };
        }
    );
}
