import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { Compartment, Flow } from '@core/types/model.types';
import { Diff, getDiff } from '@core/utils';
import { EdgeCollection, EdgeSingular, NodeSingular } from 'cytoscape';
import klay from 'cytoscape-klay';
import { CompartmentComponent } from 'src/app/components/graph/compartment/compartment.component';
import { FlowComponent } from 'src/app/components/graph/flow/flow.component';

export interface GraphModel {
    compartments: Compartment[];
    flows: Flow[];
}

const cytoscapeLayoutOptions: klay.KlayLayoutOptions = {
    name: 'klay',
    fit: true,
    animate: true,
    animationEasing: 'ease-in-out',
    animationDuration: 300,
    padding: 100,
    klay: {
        spacing: 100,
    },
};

@Injectable()
export class GraphService {
    private readonly appRef: ApplicationRef = inject(ApplicationRef);
    private readonly environmentInjector: EnvironmentInjector =
        inject(EnvironmentInjector);

    public layout(cytoscapeObj: cytoscape.Core): void {
        cytoscapeObj.layout(cytoscapeLayoutOptions).run();
    }

    public updateGraph(
        previousModel: GraphModel,
        currentModel: GraphModel,
        cytoscapeObj: cytoscape.Core,
    ): void {
        if (!currentModel.compartments.length && !currentModel.flows.length) {
            this.clear(cytoscapeObj);

            return;
        }

        this.updateCompartments(
            cytoscapeObj,
            previousModel.compartments,
            currentModel.compartments,
        );

        this.updateFlows(cytoscapeObj, previousModel.flows, currentModel.flows);

        this.layout(cytoscapeObj);
    }

    private clear(cytoscapeObj: cytoscape.Core): void {
        cytoscapeObj.elements().remove();
    }

    private updateCompartments(
        cytoscapeObj: cytoscape.Core,
        previousCompartments: Compartment[],
        currentCompartments: Compartment[],
    ): void {
        const diff: Diff<Compartment> = getDiff(
            previousCompartments,
            currentCompartments,
        );

        diff.added.forEach((compartment: Compartment): void => {
            this.addCompartment(cytoscapeObj, compartment);
        });

        diff.updated.forEach((compartment: Compartment): void => {
            this.updateCompartment(cytoscapeObj, compartment);
        });

        diff.removed.forEach((compartment: Compartment): void => {
            this.removeCompartment(cytoscapeObj, compartment.id);
        });
    }

    private addCompartment(
        cytoscapeObj: cytoscape.Core,
        compartment: Compartment,
    ): void {
        const componentRef: ComponentRef<CompartmentComponent> =
            this.createNodeComponent(compartment);

        cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: compartment.id,
                componentRef,
            },
            classes: 'compartment',
            renderedPosition: {
                x: cytoscapeObj.width() / 2,
                y: cytoscapeObj.height() / 2,
            },
        });
    }

    private updateCompartment(
        cytoscapeObj: cytoscape.Core,
        compartment: Compartment,
    ): void {
        const node: NodeSingular = cytoscapeObj
            .nodes('.compartment[componentRef]')
            .$id(compartment.id);
        const componentRef: ComponentRef<CompartmentComponent> =
            node.data('componentRef');
        const componentData: Compartment = componentRef.instance.data();

        const expressionRegExp: RegExp = new RegExp(
            `\\b${componentData.name}\\b`,
            'g',
        );

        componentRef.setInput('data', compartment);

        cytoscapeObj
            .edges('.flow[componentRef]')
            .forEach((edge: EdgeSingular): void => {
                const componentRef: ComponentRef<FlowComponent> =
                    edge.data('componentRef');
                const componentData: Flow = componentRef.instance.data();

                componentRef.setInput('data', {
                    ...componentData,
                    equation: componentData.equation.replace(
                        expressionRegExp,
                        compartment.name,
                    ),
                });
            });
    }

    private removeCompartment(cytoscapeObj: cytoscape.Core, id: string): void {
        const node: NodeSingular = cytoscapeObj
            .nodes('.compartment[componentRef]')
            .$id(id);
        const componentRef: ComponentRef<CompartmentComponent> =
            node.data('componentRef');
        const componentData: Compartment = componentRef.instance.data();

        const expressionRegExp: RegExp = new RegExp(
            `\\b${componentData.name}\\b`,
            'g',
        );
        const edges: EdgeCollection = cytoscapeObj
            .edges('.flow[componentRef]')
            .filter((edge: EdgeSingular): boolean => {
                const componentRef: ComponentRef<FlowComponent> =
                    edge.data('componentRef');
                const componentData: Flow = componentRef.instance.data();

                return !!componentData.equation.match(expressionRegExp);
            });

        edges.remove();
        node.remove();
    }

    private updateFlows(
        cytoscapeObj: cytoscape.Core,
        previousFlows: Flow[],
        currentFlows: Flow[],
    ): void {
        const diff: Diff<Flow> = getDiff(previousFlows, currentFlows);

        diff.added.forEach((flow: Flow): void => {
            this.addFlow(cytoscapeObj, flow);
        });

        diff.updated.forEach((flow: Flow): void => {
            this.updateFlow(cytoscapeObj, flow);
        });

        diff.removed.forEach((flow: Flow): void => {
            this.removeFlow(cytoscapeObj, flow.id);
        });
    }

    private addFlow(cytoscapeObj: cytoscape.Core, flow: Flow): void {
        const componentRef: ComponentRef<FlowComponent> =
            this.createFlowComponent(flow);

        cytoscapeObj.add({
            group: 'edges',
            data: {
                id: flow.id,
                source: flow.source,
                target: flow.target,
                componentRef,
            },
            classes: 'flow',
        });
    }

    private updateFlow(cytoscapeObj: cytoscape.Core, flow: Flow): void {
        const edge: EdgeSingular = cytoscapeObj
            .edges('.flow[componentRef]')
            .$id(flow.id);
        const componentRef: ComponentRef<FlowComponent> =
            edge.data('componentRef');

        edge.move({
            source: flow.source,
            target: flow.target,
        });
        componentRef.setInput('data', flow);
    }

    private removeFlow(cytoscapeObj: cytoscape.Core, id: string): void {
        cytoscapeObj.edges('.flow[componentRef]').$id(id).remove();
    }

    private createNodeComponent(
        data: Compartment,
    ): ComponentRef<CompartmentComponent> {
        const hostElement: HTMLElement =
            document.createElement('app-compartment');

        const componentRef: ComponentRef<CompartmentComponent> =
            createComponent(CompartmentComponent, {
                environmentInjector: this.environmentInjector,
                hostElement,
            });

        componentRef.setInput('data', data);
        this.appRef.attachView(componentRef.hostView);

        return componentRef;
    }

    private createFlowComponent(data: Flow): ComponentRef<FlowComponent> {
        const hostElement: HTMLElement = document.createElement('app-flow');

        const componentRef: ComponentRef<FlowComponent> = createComponent(
            FlowComponent,
            {
                environmentInjector: this.environmentInjector,
                hostElement,
            },
        );

        componentRef.setInput('data', data);
        this.appRef.attachView(componentRef.hostView);

        return componentRef;
    }
}
