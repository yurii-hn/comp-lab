import { computed, effect, inject, Signal, untracked } from '@angular/core';
import { Compartment, Flow } from '@core/types/model.types';
import { areEqual, fromResizeObserver } from '@core/utils';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { Store } from '@ngrx/store';
import cytoscape from 'cytoscape';
import edgehandles, { EdgeHandlesInstance } from 'cytoscape-edgehandles';
import klay from 'cytoscape-klay';
import {
  bufferCount,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  Observer,
  Subscription,
  tap,
} from 'rxjs';
import { GraphModel, GraphService } from 'src/app/services/graph.service';
import { Workspace } from 'src/app/state/reducers/workspace.reducer';
import { selectCurrentWorkspace } from 'src/app/state/selectors/workspace.selectors';

cytoscape.use(klay);
cytoscape.use(edgehandles);

type CytoscapeEventHandlerFnParams = [
    event: cytoscape.EventObject,
    ...extraParams: any,
];

export interface State {
    cytoscapeObj: cytoscape.Core | null;
    selectedElement: cytoscape.SingularElementArgument | null;
    openedElement: cytoscape.SingularElementArgument | null;
}

const cytoscapeOptions: cytoscape.CytoscapeOptions = {
    minZoom: 0.1,
    maxZoom: 3,
    zoom: 1,
    wheelSensitivity: 0.1,
    style: [
        {
            selector: 'node.compartment',
            style: {
                label: 'data(name)',
                'font-weight': 'bold',
                color: 'white',
                width: '100px',
                height: '50px',
                backgroundColor: '#d60053',
                'background-blacken': 0.2,
                shape: 'round-rectangle',
            },
        },
        {
            selector: 'node:selected',
            style: {
                backgroundColor: 'blue',
                'background-blacken': 0,
            },
        },
        {
            selector: 'edge',
            style: {
                width: 3,
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle-backcurve',
                'arrow-scale': 2,
                color: 'white',
            },
        },
    ],
    selectionType: 'single',
    boxSelectionEnabled: false,
    styleEnabled: true,
};

const initialState: State = {
    cytoscapeObj: null,
    selectedElement: null,
    openedElement: null,
};

export const AppStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);
        const graphService: GraphService = inject(GraphService);

        return {
            _globalStore: globalStore,
            _graphService: graphService,
        };
    }),
    withComputed((store) => {
        const isElementSelected: Signal<boolean> = computed(
            (): boolean => !!store.selectedElement(),
        );

        return {
            isElementSelected,
        };
    }),
    withMethods((store) => {
        const initGraph = (container: HTMLElement): void =>
            patchState(store, {
                cytoscapeObj: cytoscape({
                    container: container,
                    ...cytoscapeOptions,
                }),
            });

        const setSelectedElement = (
            element: cytoscape.SingularElementArgument | null,
        ): void =>
            patchState(store, {
                selectedElement: element,
            });

        const setOpenedElement = (
            element: cytoscape.SingularElementArgument | null,
        ): void =>
            patchState(store, {
                openedElement: element,
            });

        const resetOpenedElement = (): void =>
            patchState(store, {
                openedElement: null,
            });

        const layoutGraph = (): void => {
            const cytoscapeObj: cytoscape.Core | null = store.cytoscapeObj();

            if (!cytoscapeObj) {
                return;
            }

            store._graphService.layout(cytoscapeObj);
        };

        return {
            initGraph,
            layoutGraph,
            resetOpenedElement,

            _setSelectedElement: setSelectedElement,
            _setOpenedElement: setOpenedElement,
        };
    }),
    withHooks((store) => {
        let subscription: Subscription = new Subscription();

        const onInit = (): void => {
            // TODO: Refactor this
            effect((): void => {
                const cytoscapeObj: cytoscape.Core | null =
                    store.cytoscapeObj();

                untracked((): void => {
                    subscription.unsubscribe();
                    subscription = new Subscription();

                    if (!cytoscapeObj) {
                        return;
                    }

                    const windowResizeSub: Subscription = fromResizeObserver(
                        window.document.body,
                    )
                        .pipe(
                            debounceTime(500),
                            tap((): void =>
                                store._graphService.layout(cytoscapeObj),
                            ),
                        )
                        .subscribe();

                    const selectElementSub: Subscription =
                        fromCytoscapeObjEvent(
                            cytoscapeObj,
                            'select',
                            'node, edge',
                        )
                            .pipe(
                                tap({
                                    next: (
                                        params: CytoscapeEventHandlerFnParams,
                                    ) =>
                                        store._setSelectedElement(
                                            params[0].target,
                                        ),
                                    unsubscribe: (): void =>
                                        store._setSelectedElement(null),
                                }),
                            )
                            .subscribe();

                    const unselectElementSub: Subscription =
                        fromCytoscapeObjEvent(
                            cytoscapeObj,
                            'unselect',
                            'node, edge',
                        )
                            .pipe(
                                tap({
                                    next: () => store._setSelectedElement(null),
                                }),
                            )
                            .subscribe();

                    const openElementSub: Subscription = fromCytoscapeObjEvent(
                        cytoscapeObj,
                        'dblclick',
                        'node, edge',
                    )
                        .pipe(
                            tap({
                                next: (params: CytoscapeEventHandlerFnParams) =>
                                    store._setOpenedElement(params[0].target),
                                unsubscribe: (): void =>
                                    store._setOpenedElement(null),
                            }),
                        )
                        .subscribe();

                    const startFlowCreationSub: Subscription =
                        fromCytoscapeObjEvent(cytoscapeObj, 'cxttap', 'node')
                            .pipe(
                                tap(
                                    (
                                        params: CytoscapeEventHandlerFnParams,
                                    ): void => {
                                        const edgehandles: EdgeHandlesInstance =
                                            cytoscapeObj.edgehandles();
                                        const node: cytoscape.NodeSingular =
                                            params[0].target;

                                        edgehandles.start(node);
                                    },
                                ),
                            )
                            .subscribe();

                    const createFlowSub: Subscription = fromCytoscapeObjEvent(
                        cytoscapeObj,
                        'ehcomplete',
                    )
                        .pipe(
                            tap({
                                next: (params: CytoscapeEventHandlerFnParams) =>
                                    store._setOpenedElement(params[3]),
                                unsubscribe: (): void =>
                                    store._setOpenedElement(null),
                            }),
                        )
                        .subscribe();

                    const updateGraphSub: Subscription = store._globalStore
                        .select(selectCurrentWorkspace)
                        .pipe(
                            map(
                                (workspace: Workspace): GraphModel => ({
                                    compartments: workspace.model.compartments,
                                    flows: workspace.model.flows,
                                }),
                            ),
                            distinctUntilChanged(areModelsEqual),
                            bufferCount(2, 1),
                            tap(
                                ([
                                    previousModel,
                                    currentModel,
                                ]: GraphModel[]): void =>
                                    store._graphService.updateGraph(
                                        previousModel,
                                        currentModel,
                                        cytoscapeObj,
                                    ),
                            ),
                        )
                        .subscribe();

                    subscription.add(windowResizeSub);
                    subscription.add(selectElementSub);
                    subscription.add(unselectElementSub);
                    subscription.add(openElementSub);
                    subscription.add(startFlowCreationSub);
                    subscription.add(createFlowSub);
                    subscription.add(updateGraphSub);
                });
            });
        };

        const onDestroy = (): void => {
            subscription.unsubscribe();
        };

        return {
            onInit,
            onDestroy,
        };
    }),
);

function fromCytoscapeObjEvent(
    cytoscapeObj: cytoscape.Core,
    event: string,
    selector?: cytoscape.Selector,
): Observable<CytoscapeEventHandlerFnParams> {
    return new Observable(
        (observer: Observer<CytoscapeEventHandlerFnParams>): void => {
            if (selector) {
                cytoscapeObj.on(
                    event,
                    selector,
                    (...args: CytoscapeEventHandlerFnParams): void => {
                        observer.next(args);
                    },
                );

                return;
            }
            cytoscapeObj.on(
                event,
                (...args: CytoscapeEventHandlerFnParams): void => {
                    observer.next(args);
                },
            );
        },
    );
}

function areModelsEqual(modelA: GraphModel, modelB: GraphModel): boolean {
    const modelAClone: GraphModel = structuredClone(modelA);
    const modelBClone: GraphModel = structuredClone(modelB);

    modelAClone.compartments.sort(compartmentsSortComparator);
    modelBClone.compartments.sort(compartmentsSortComparator);

    modelAClone.flows.sort(flowsSortComparator);
    modelBClone.flows.sort(flowsSortComparator);

    return areEqual(modelAClone, modelBClone);
}

function compartmentsSortComparator(
    compartmentA: Compartment,
    compartmentB: Compartment,
): number {
    return compartmentA.id.localeCompare(compartmentB.id);
}

function flowsSortComparator(flowA: Flow, flowB: Flow): number {
    return flowA.id.localeCompare(flowB.id);
}
