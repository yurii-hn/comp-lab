// Code is based on https://github.com/mwri/cytoscape-dom-node
import { ComponentRef } from '@angular/core';
import {
  CytoscapeEventHandlerFnParams,
  fromCytoscapeObjEvent,
} from '@core/utils';
import cytoscape, { EdgeSingular, NodeSingular } from 'cytoscape';
import { map, Subscription, tap } from 'rxjs';
import { CompartmentComponent } from 'src/app/components/graph/compartment/compartment.component';
import { FlowComponent } from 'src/app/components/graph/flow/flow.component';

export interface CytoscapeHTMLElement extends HTMLElement {
    __cy_id: string;
}

export type CytoscapeDomInstance = CytoscapeDom;

declare global {
    namespace cytoscape {
        interface Core {
            dom: () => CytoscapeDomInstance;
        }
    }
}

class CytoscapeDom {
    private readonly domContainer: HTMLDivElement;
    private readonly compartmentsResizeObserver: ResizeObserver;
    private readonly subscription: Subscription = new Subscription();

    constructor(private readonly cytoscapeObj: cytoscape.Core) {
        const cytoscapeContainer: Element | null =
            this.cytoscapeObj.container();

        if (!cytoscapeContainer) {
            throw new Error('Cytoscape does not have a container');
        }

        const canvas: HTMLCanvasElement = cytoscapeContainer.querySelector(
            'canvas',
        ) as HTMLCanvasElement;
        const domContainer: HTMLDivElement = document.createElement('div');

        domContainer.style.position = 'absolute';
        domContainer.style.zIndex = '10';

        canvas.parentNode!.appendChild(domContainer);
        this.domContainer = domContainer;

        this.compartmentsResizeObserver = new ResizeObserver(
            (entries: ResizeObserverEntry[]): void => {
                entries.forEach((entry: ResizeObserverEntry): void => {
                    const container: CytoscapeHTMLElement =
                        entry.target as CytoscapeHTMLElement;
                    const node: NodeSingular = this.cytoscapeObj.getElementById(
                        container.__cy_id,
                    );

                    node.style({
                        width: container.offsetWidth,
                        height: container.offsetHeight,
                    });
                });
            },
        );

        this.cytoscapeObj
            .elements('node.compartment[componentRef], edge.flow[componentRef]')
            .forEach((node: NodeSingular): void => this.onElementAdd(node));

        this.initListeners();
    }

    private initListeners(): void {
        const nodeAddSub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'add',
            'node.compartment[componentRef], edge.flow[componentRef]',
        )
            .pipe(
                map(
                    (
                        params: CytoscapeEventHandlerFnParams,
                    ): NodeSingular | EdgeSingular => params[0].target,
                ),
                tap(this.onElementAdd.bind(this)),
            )
            .subscribe();

        const panZoomSub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'pan zoom',
        )
            .pipe(tap(this.onPanZoom.bind(this)))
            .subscribe();

        const positionSub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'position bounds',
            'node.compartment[componentRef]',
        )
            .pipe(
                map(
                    (params: CytoscapeEventHandlerFnParams): NodeSingular =>
                        params[0].target,
                ),
                tap(this.onPosition.bind(this)),
            )
            .subscribe();

        const selectionSub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'select unselect',
            'node.compartment[componentRef]',
        )
            .pipe(
                map(
                    (params: CytoscapeEventHandlerFnParams): NodeSingular =>
                        params[0].target,
                ),
                tap(this.onNodeSelectionChange.bind(this)),
            )
            .subscribe();

        const removeSub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'remove',
            'node.compartment[componentRef], edge.flow[componentRef]',
        )
            .pipe(
                map(
                    (
                        params: CytoscapeEventHandlerFnParams,
                    ): NodeSingular | EdgeSingular => params[0].target,
                ),
                tap(this.onRemove.bind(this)),
            )
            .subscribe();

        const destroySub: Subscription = fromCytoscapeObjEvent(
            this.cytoscapeObj,
            'destroy',
        )
            .pipe(tap(this.onDestroy.bind(this)))
            .subscribe();

        this.subscription.add(nodeAddSub);
        this.subscription.add(panZoomSub);
        this.subscription.add(positionSub);
        this.subscription.add(selectionSub);
        this.subscription.add(removeSub);
        this.subscription.add(destroySub);
    }

    private onElementAdd(element: NodeSingular | EdgeSingular): void {
        const componentRef: ComponentRef<CompartmentComponent | FlowComponent> =
            element.data('componentRef');
        const hostElement: CytoscapeHTMLElement =
            componentRef.location.nativeElement;

        hostElement.__cy_id = element.id();

        this.domContainer.appendChild(hostElement);

        if (element.isNode()) {
            this.compartmentsResizeObserver.observe(hostElement);
        }
    }

    private onPanZoom(): void {
        const pan: cytoscape.Position = this.cytoscapeObj.pan();
        const zoom: number = this.cytoscapeObj.zoom();

        const transform: string = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

        this.domContainer.style.transform = transform;
    }

    private onPosition(node: NodeSingular): void {
        const componentRef: ComponentRef<CompartmentComponent> =
            node.data('componentRef');
        const domElement: CytoscapeHTMLElement =
            componentRef.location.nativeElement;

        if (!domElement.isConnected) {
            return;
        }

        const position: cytoscape.Position = node.position();

        domElement.style.transform = `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`;
        domElement.style.position = 'absolute';
        domElement.style.zIndex = '10';

        node.connectedEdges('[componentRef]').forEach(
            (edge: EdgeSingular): void => {
                const componentRef: ComponentRef<FlowComponent> =
                    edge.data('componentRef');
                const domElement: CytoscapeHTMLElement =
                    componentRef.location.nativeElement;

                const midpoint: cytoscape.Position = edge.midpoint();
                const sourceEndpoint: cytoscape.Position =
                    edge.sourceEndpoint();
                const targetEndpoint: cytoscape.Position =
                    edge.targetEndpoint();

                const width: number = Math.floor(
                    Math.sqrt(
                        (sourceEndpoint.x - targetEndpoint.x) ** 2 +
                            (sourceEndpoint.y - targetEndpoint.y) ** 2,
                    ),
                );

                componentRef.setInput('maxWidth', width);

                domElement.style.transform = `translate(-50%, -50%) translate(${midpoint.x}px, ${midpoint.y}px)`;
                domElement.style.position = 'absolute';
                domElement.style.zIndex = '10';
            },
        );
    }

    private onNodeSelectionChange(node: NodeSingular): void {
        const componentRef: ComponentRef<CompartmentComponent> =
            node.data('componentRef');

        componentRef.setInput('selected', node.selected());
    }

    private onRemove(element: NodeSingular | EdgeSingular): void {
        const componentRef: ComponentRef<CompartmentComponent | FlowComponent> =
            element.data('componentRef');
        const hostElement: CytoscapeHTMLElement =
            componentRef.location.nativeElement;

        this.domContainer.removeChild(hostElement);
        this.compartmentsResizeObserver.unobserve(hostElement);
        componentRef.destroy();
    }

    private onDestroy(): void {
        this.domContainer.remove();
        this.compartmentsResizeObserver.disconnect();
        this.subscription.unsubscribe();
    }
}

export default function register(cytoscapeExtensionFn: typeof cytoscape): void {
    if (!cytoscapeExtensionFn) {
        return;
    }

    cytoscapeExtensionFn(
        'core',
        'dom',
        function (this: cytoscape.Core): CytoscapeDom {
            return new CytoscapeDom(this);
        },
    );
}
