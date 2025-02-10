import { Observable, Subscriber } from 'rxjs';
import { Point, Values } from './types/processing';

export function fromResizeObserver(
    target: Element,
): Observable<ResizeObserverEntry> {
    return new Observable(
        (subscriber: Subscriber<ResizeObserverEntry>): (() => void) => {
            const resizeObserver = new ResizeObserver(
                (entries: ResizeObserverEntry[]): void => {
                    entries.forEach((entry: ResizeObserverEntry): void => {
                        subscriber.next(entry);
                    });
                },
            );

            resizeObserver.observe(target);

            return (): void => {
                resizeObserver.unobserve(target);
                resizeObserver.disconnect();
            };
        },
    );
}

export function areEqual<Value>(valueA: Value, valueB: Value): boolean {
    return JSON.stringify(valueA) === JSON.stringify(valueB);
}

export function valuesToRowData(values: Values[]): Record<string, number>[] {
    if (!values.length) {
        return [];
    }

    const times: number[] = getSetArray(
        values.reduce(
            (times: number[], value: Values): number[] =>
                times.concat(value.values.map((point): number => point.time)),
            [],
        ),
    );

    times.sort((timeA: number, timeB: number): number => timeA - timeB);

    return times.reduce(
        (
            rowsData: Record<string, number>[],
            time: number,
        ): Record<string, number>[] =>
            rowsData.concat(
                values.reduce(
                    (
                        row: Record<string, number>,
                        value: Values,
                    ): Record<string, number> => {
                        const point: Point | undefined = value.values.find(
                            (point: Point): boolean => point.time === time,
                        );

                        if (point) {
                            row[value.name] = point.value;
                        }

                        return row;
                    },
                    {
                        t: time,
                    },
                ),
            ),
        [],
    );
}

export function rowDataToValues(rowData: Record<string, number>[]): Values[] {
    if (!rowData.length) {
        return [];
    }

    const columns: string[] = getSetArray(
        rowData.reduce(
            (columns: string[], row: Record<string, number>): string[] =>
                columns.concat(
                    Object.keys(row).filter(
                        (name: string): boolean => name !== 't',
                    ),
                ),
            [],
        ),
    );

    return columns.reduce((values: Values[], name: string): Values[] => {
        const currentValues: Point[] = rowData.reduce(
            (currentValues: Point[], row: Record<string, number>): Point[] => {
                if (!row.hasOwnProperty(name)) {
                    return currentValues;
                }

                return currentValues.concat({
                    time: row['t'],
                    value: row[name],
                });
            },
            [],
        );

        if (currentValues.length) {
            currentValues.sort(
                (pointA: Point, pointB: Point): number =>
                    pointA.time - pointB.time,
            );

            values.push({
                name,
                values: currentValues,
            });
        }

        return values;
    }, []);
}

export function getSetArray<Type>(array: Type[]): Type[] {
    return Array.from(new Set(array));
}
