import { Observable, Subscriber } from 'rxjs';

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
