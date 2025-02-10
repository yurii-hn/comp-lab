import { Injectable } from '@angular/core';
import { Compartment, Flow } from '@core/types/model.types';
import klay from 'cytoscape-klay';

interface Diff<Type extends { id: string }> {
    added: Type[];
    updated: Type[];
    removed: Type[];
}

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
        const diff: Diff<Compartment> = this.getDiff(
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
        cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: compartment.id,
                name: compartment.name,
                value: compartment.value,
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
        const node: cytoscape.NodeSingular = cytoscapeObj
            .nodes()
            .$id(compartment.id);

        const name: string = node.data('name');
        const expressionRegExp: RegExp = new RegExp(`\\b${name}\\b`, 'g');

        cytoscapeObj.edges().forEach((edge: cytoscape.EdgeSingular): void => {
            edge.data(
                'equation',
                edge
                    .data('equation')
                    .replace(expressionRegExp, compartment.name),
            );
        });

        node.data({
            name: compartment.name,
            value: compartment.value,
        });
    }

    private removeCompartment(cytoscapeObj: cytoscape.Core, id: string): void {
        const node: cytoscape.NodeSingular = cytoscapeObj.nodes().$id(id);

        const expressionRegExp: RegExp = new RegExp(
            `\\b${node.data('name')}\\b`,
            'g',
        );
        const edges: cytoscape.EdgeCollection = cytoscapeObj
            .edges()
            .filter((edge: cytoscape.EdgeSingular): boolean =>
                edge.data('equation').match(expressionRegExp),
            );

        edges.remove();
        node.remove();
    }

    private updateFlows(
        cytoscapeObj: cytoscape.Core,
        previousFlows: Flow[],
        currentFlows: Flow[],
    ): void {
        const diff: Diff<Flow> = this.getDiff(previousFlows, currentFlows);

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
        cytoscapeObj.add({
            group: 'edges',
            data: {
                id: flow.id,
                source: flow.source,
                target: flow.target,
                equation: flow.equation,
            },
        });
    }

    private updateFlow(cytoscapeObj: cytoscape.Core, flow: Flow): void {
        const edge: cytoscape.EdgeSingular = cytoscapeObj.edges().$id(flow.id);

        edge.data('equation', flow.equation);
        edge.move({
            source: flow.source,
            target: flow.target,
        });
    }

    private removeFlow(cytoscapeObj: cytoscape.Core, id: string): void {
        cytoscapeObj.edges().$id(id).remove();
    }

    private getDiff<Type extends { id: string }>(
        oldArray: Type[],
        newArray: Type[],
    ): Diff<Type> {
        const diff: Diff<Type> = {
            added: [],
            updated: [],
            removed: [],
        };

        newArray.forEach((newItem: Type): void => {
            if (
                oldArray.find(
                    (oldItem: Type): boolean => oldItem.id === newItem.id,
                )
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
                        (newItem: Type): boolean => newItem.id === oldItem.id,
                    ),
            ),
        );

        return diff;
    }
}
