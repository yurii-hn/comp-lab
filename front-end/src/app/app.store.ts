import { computed, effect, inject, Signal, untracked } from '@angular/core';
import { Compartment, Flow } from '@core/types/model.types';
import {
  areEqual,
  CytoscapeEventHandlerFnParams,
  fromCytoscapeObjEvent,
  observeResizes,
} from '@core/utils';
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
import cytoscape, { EdgeSingular, NodeSingular } from 'cytoscape';
import edgehandles, { EdgeHandlesInstance } from 'cytoscape-edgehandles';
import klay from 'cytoscape-klay';
import {
  bufferCount,
  debounceTime,
  distinctUntilChanged,
  map,
  Subscription,
  tap,
} from 'rxjs';
import { GraphModel, GraphService } from 'src/app/services/graph.service';
import { Workspace } from 'src/app/state/reducers/workspace.reducer';
import { selectCurrentWorkspace } from 'src/app/state/selectors/workspace.selectors';
import dom from './core/cytoscape-dom';

cytoscape.use(klay);
cytoscape.use(edgehandles);
cytoscape.use(dom);

export interface State {
    _cytoscapeObj: cytoscape.Core | null;
    selectedElement: NodeSingular | EdgeSingular | null;
    openedElement: NodeSingular | EdgeSingular | null;
}

const cytoscapeOptions: cytoscape.CytoscapeOptions = {
    minZoom: 0.1,
    maxZoom: 3,
    zoom: 1,
    wheelSensitivity: 0.1,
    selectionType: 'single',
    boxSelectionEnabled: false,
    styleEnabled: true,
    style: [
        {
            selector: 'node.compartment',
            style: {
                shape: 'rectangle',
                'background-opacity': 0,
                'overlay-padding': 0,
            },
        },
        {
            selector: 'edge.flow',
            style: {
                width: 3,
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle-backcurve',
                'arrow-scale': 2,
                'overlay-padding': 0,
            },
        },
    ],
};

const initialState: State = {
    _cytoscapeObj: null,
    selectedElement: null,
    openedElement: null,
};

export const AppStore = signalStore(
    withState(initialState),
    withProps(() => {
        const globalStore: Store = inject(Store);
        const graphService: GraphService = inject(GraphService);
        const subscription: Subscription = new Subscription();

        return {
            _globalStore: globalStore,
            _graphService: graphService,
            _subscription: subscription,
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
                _cytoscapeObj: cytoscape({
                    container: container,
                    ...cytoscapeOptions,
                }),
            });

        const setSelectedElement = (
            element: NodeSingular | EdgeSingular | null,
        ): void =>
            patchState(store, {
                selectedElement: element,
            });

        const setOpenedElement = (
            element: NodeSingular | EdgeSingular | null,
        ): void =>
            patchState(store, {
                openedElement: element,
            });

        const resetOpenedElement = (): void =>
            patchState(store, {
                openedElement: null,
            });

        const layoutGraph = (): void => {
            const cytoscapeObj: cytoscape.Core | null = store._cytoscapeObj();

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
        const onInit = (): void => {
            // TODO: Refactor this
            effect((): void => {
                const cytoscapeObj: cytoscape.Core | null =
                    store._cytoscapeObj();

                untracked((): void => {
                    store._subscription.unsubscribe();
                    store._subscription = new Subscription();

                    if (!cytoscapeObj) {
                        return;
                    }

                    const edgehandles: EdgeHandlesInstance =
                        cytoscapeObj!.edgehandles();

                    cytoscapeObj!.dom();

                    const windowResizeSub: Subscription = observeResizes(
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
                            'node.compartment[componentRef], edge.flow[componentRef]',
                        )
                            .pipe(
                                tap({
                                    next: (
                                        params: CytoscapeEventHandlerFnParams,
                                    ) => {
                                        const element:
                                            | NodeSingular
                                            | EdgeSingular = params[0].target;

                                        cytoscapeObj
                                            .elements(':selected')
                                            .not(element)
                                            .unselect();

                                        store._setSelectedElement(element);
                                    },
                                    unsubscribe: (): void =>
                                        store._setSelectedElement(null),
                                }),
                            )
                            .subscribe();

                    const unselectElementSub: Subscription =
                        fromCytoscapeObjEvent(
                            cytoscapeObj,
                            'unselect',
                            'node.compartment[componentRef], edge.flow[componentRef]',
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
                        'node.compartment[componentRef], edge.flow[componentRef]',
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
                        fromCytoscapeObjEvent(
                            cytoscapeObj,
                            'cxttap',
                            'node.compartment[componentRef]',
                        )
                            .pipe(
                                tap(
                                    (
                                        params: CytoscapeEventHandlerFnParams,
                                    ): void => {
                                        const node: NodeSingular =
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

                    store._subscription.add(windowResizeSub);
                    store._subscription.add(selectElementSub);
                    store._subscription.add(unselectElementSub);
                    store._subscription.add(openElementSub);
                    store._subscription.add(startFlowCreationSub);
                    store._subscription.add(createFlowSub);
                    store._subscription.add(updateGraphSub);
                });
            });
        };

        const onDestroy = (): void => {
            store._subscription.unsubscribe();
        };

        return {
            onInit,
            onDestroy,
        };
    }),
);

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
