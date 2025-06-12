import { Data } from '@core/types/processing';
import { Observable, Observer, Subscriber } from 'rxjs';

export function observeResizes(
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

export type CytoscapeEventHandlerFnParams = [
    event: cytoscape.EventObject,
    ...extraParams: any
];

export function fromCytoscapeObjEvent(
    cytoscapeObj: cytoscape.Core,
    event: string,
    selector?: cytoscape.Selector
): Observable<CytoscapeEventHandlerFnParams> {
    return new Observable(
        (observer: Observer<CytoscapeEventHandlerFnParams>): void => {
            if (selector) {
                cytoscapeObj.on(
                    event,
                    selector,
                    (...args: CytoscapeEventHandlerFnParams): void => {
                        observer.next(args);
                    }
                );

                return;
            }
            cytoscapeObj.on(
                event,
                (...args: CytoscapeEventHandlerFnParams): void => {
                    observer.next(args);
                }
            );
        }
    );
}

export function areEqual<Value>(valueA: Value, valueB: Value): boolean {
    return JSON.stringify(valueA) === JSON.stringify(valueB);
}

export function datasetToRowData(
    dataset: Record<string, Data>
): Record<string, number>[] {
    if (!Object.keys(dataset).length) {
        return [];
    }

    const times: number[] = getSetArray(
        Object.values(dataset).reduce(
            (times: number[], data: Data): number[] => times.concat(data.times),
            []
        )
    );

    times.sort((timeA: number, timeB: number): number => timeA - timeB);

    return times.reduce(
        (
            rowsData: Record<string, number>[],
            time: number
        ): Record<string, number>[] =>
            rowsData.concat(
                Object.entries(dataset).reduce(
                    (
                        row: Record<string, number>,
                        [name, data]: [string, Data]
                    ): Record<string, number> => {
                        const index: number = data.times.indexOf(time);

                        if (index !== -1) {
                            row[name] = data.values[index];
                        }

                        return row;
                    },
                    {
                        t: time,
                    }
                )
            ),
        []
    );
}

export function rowDataToDataset(
    rowData: Record<string, number>[]
): Record<string, Data> {
    if (!rowData.length) {
        return {};
    }

    const columns: string[] = getSetArray(
        rowData.reduce(
            (columns: string[], row: Record<string, number>): string[] =>
                columns.concat(
                    Object.keys(row).filter(
                        (name: string): boolean => name !== 't'
                    )
                ),
            []
        )
    );

    return columns.reduce(
        (dataset: Record<string, Data>, name: string): Record<string, Data> => {
            const rawData: [number, number][] = rowData.reduce(
                (
                    data: [number, number][],
                    row: Record<string, number>
                ): [number, number][] => {
                    if (!row.hasOwnProperty(name)) {
                        return data;
                    }

                    data.push([row['t'], row[name]]);

                    return data;
                },
                []
            );

            if (rawData.length) {
                rawData.sort(
                    (
                        pairA: [number, number],
                        pairB: [number, number]
                    ): number => pairA[0] - pairB[0]
                );

                dataset[name] = {
                    times: rawData.map(
                        (pair: [number, number]): number => pair[0]
                    ),
                    values: rawData.map(
                        (pair: [number, number]): number => pair[1]
                    ),
                };
            }

            return dataset;
        },
        {}
    );
}

export function getSetArray<Type>(array: Type[]): Type[] {
    return Array.from(new Set(array));
}

export interface Diff<Type extends { id: string }> {
    added: Type[];
    updated: Type[];
    removed: Type[];
}

export function getDiff<Type extends { id: string }>(
    oldArray: Type[],
    newArray: Type[]
): Diff<Type> {
    const diff: Diff<Type> = {
        added: [],
        updated: [],
        removed: [],
    };

    newArray.forEach((newItem: Type): void => {
        if (
            oldArray.find((oldItem: Type): boolean => oldItem.id === newItem.id)
        ) {
            diff.updated.push(newItem);

            return;
        }

        diff.added.push(newItem);
    });

    diff.removed.push(
        ...oldArray.filter(
            (oldItem: Type): boolean =>
                !newArray.find(
                    (newItem: Type): boolean => newItem.id === oldItem.id
                )
        )
    );

    return diff;
}
