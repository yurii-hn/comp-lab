import { DataSource } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import cytoscape, {
    EdgeCollection,
    EdgeSingular,
    EventObject,
    NodeSingular,
    SingularElementArgument,
} from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import klay from 'cytoscape-klay';
import {
    BehaviorSubject,
    Observable,
    Subject,
    Subscription,
    bufferCount,
    filter,
    tap,
} from 'rxjs';
import { cytoscapeLayoutOptions, cytoscapeOptions } from '../core/constants';
import {
    Definition,
    DefinitionType,
    ICompartment,
    ICompartmentBase,
    ICompartmentDefinition,
    IConstant,
    IDefinitionsTable,
    IEditCompartmentPayload,
    IExportModel,
    IFlow,
    IImportModel,
    IIntervention,
    IInterventionDefinition,
    IWorkspaceBase,
} from '../core/interfaces';
import { SamplesService } from './model-samples.service';
import { ValidationService } from './validation.service';
import { WorkspacesService } from './workspaces.service';

cytoscape.use(klay);
cytoscape.use(edgehandles);

@Injectable({
    providedIn: 'root',
})
export class ModelService {
    public readonly compartmentOpen: Observable<void>;
    public readonly fromOpen: Observable<void>;
    public readonly flowAdd: Observable<EdgeSingular>;

    public get selectedElement(): SingularElementArgument {
        return (
            this.cytoscapeObj &&
            (this.cytoscapeObj.elements(':selected').first().data('equation') ||
                this.cytoscapeObj.elements(':selected').first().data('name')) &&
            this.cytoscapeObj.elements(':selected').first()
        );
    }

    public get compartmentsCount(): number {
        return this.cytoscapeObj && this.cytoscapeObj.nodes().length;
    }

    private readonly compartmentOpenSubject: Subject<void> =
        new Subject<void>();
    private readonly fromOpenSubject: Subject<void> = new Subject<void>();
    private readonly flowAddSubject: Subject<EdgeSingular> =
        new Subject<EdgeSingular>();

    private cytoscapeObj!: cytoscape.Core;
    private edgehandles!: edgehandles.EdgeHandlesInstance;

    private readonly definitionsFormArray: FormArray;
    private readonly definitionsFormArrayControlsSubject: BehaviorSubject<
        FormArray['controls']
    >;

    private readonly subscription: Subscription = new Subscription();

    public constructor(
        private readonly validationService: ValidationService,
        private readonly samplesService: SamplesService,
        public readonly workspacesService: WorkspacesService
    ) {
        this.compartmentOpen = this.compartmentOpenSubject.asObservable();
        this.fromOpen = this.fromOpenSubject.asObservable();
        this.flowAdd = this.flowAddSubject.asObservable();

        this.definitionsFormArray = new FormArray([
            this.getNewDefinitionFormGroup(),
        ]);

        this.definitionsFormArrayControlsSubject = new BehaviorSubject<
            FormArray['controls']
        >(this.definitionsFormArray.controls);
    }

    public initCytoscape(container: HTMLElement): void {
        this.cytoscapeObj = cytoscape({
            container: container,
            ...cytoscapeOptions,
        });

        this.edgehandles = this.cytoscapeObj.edgehandles();

        this.cytoscapeObj.on('dblclick', (event: EventObject): void => {
            if (!event.target.group) {
                return;
            }

            if (event.target.group() === 'nodes') {
                this.compartmentOpenSubject.next();
            }

            if (event.target.group() === 'edges') {
                this.fromOpenSubject.next();
            }
        });

        this.cytoscapeObj.on(
            'cxttapend',
            'node',
            (event: EventObject): void => {
                this.edgehandles.start(event.target);
            }
        );

        this.cytoscapeObj.on('ehcomplete', ((
            event: EventObject,
            sourceNode: NodeSingular,
            targetNode: NodeSingular,
            addedEdge: EdgeSingular
        ): void => {
            this.flowAddSubject.next(addedEdge);
        }) as any);
    }

    public initWorkspaceFromSample(sampleName: string): void {
        this.samplesService
            .getSample(sampleName)
            .pipe(
                tap((sampleModel: IImportModel): void => {
                    this.workspacesService.addWorkspace({
                        model: sampleModel,
                    });

                    this.parseSample(sampleModel);

                    this.layout();
                })
            )
            .subscribe();
    }

    public layout(): void {
        this.cytoscapeObj.layout(cytoscapeLayoutOptions).run();
    }

    public getModelExport(): IExportModel {
        return {
            compartments: this.getCompartmentsBase(),
            interventions: this.getInterventions(),
            constants: this.getConstants(),
            flows: this.getFlows(),
        };
    }

    public parseSample(sample: IImportModel): void {
        this.clear(true);

        sample.compartments.forEach((compartment: ICompartmentBase): void => {
            this.addCompartment(compartment);
        });

        sample.interventions.forEach((intervention: IIntervention): void => {
            this.addDefinition({
                name: intervention.name,
                type: DefinitionType.Intervention,
            });
        });

        sample.constants.forEach((constant: IConstant): void => {
            this.addDefinition({
                name: constant.name,
                type: DefinitionType.Constant,
                value: constant.value,
            });
        });

        sample.flows.forEach((flowData: IFlow): void => {
            this.addFlow(flowData);
        });
    }

    public addNewWorkspace(): void {
        const newWorkspace: IWorkspaceBase = {
            model: {
                compartments: [],
                constants: [],
                interventions: [],
                flows: [],
            },
        };
        const currentWorkspace: IWorkspaceBase = {
            model: this.getModelExport(),
        };

        this.workspacesService.updateWorkspace(
            this.workspacesService.currentWorkspaceName,
            currentWorkspace
        );

        const workspaceName: string =
            this.workspacesService.addWorkspace(newWorkspace);

        this.workspacesService.setCurrentWorkspace(workspaceName);

        this.parseSample(newWorkspace.model);

        this.layout();
    }

    public changeWorkspace(workspaceName: string): void {
        const currentWorkspace: IWorkspaceBase = {
            model: this.getModelExport(),
        };
        const newWorkspace: IWorkspaceBase =
            this.workspacesService.getWorkspace(workspaceName);

        this.workspacesService.updateWorkspace(
            this.workspacesService.currentWorkspaceName,
            currentWorkspace
        );

        this.workspacesService.setCurrentWorkspace(workspaceName);

        this.parseSample(newWorkspace.model);

        this.layout();
    }

    public removeCurrentWorkspace(): void {
        this.workspacesService.removeWorkspace(
            this.workspacesService.currentWorkspaceName
        );

        const newCurrentWorkspace: IWorkspaceBase =
            this.workspacesService.getWorkspace(
                this.workspacesService.currentWorkspaceName
            );

        this.parseSample(newCurrentWorkspace.model);

        this.layout();
    }

    public addCompartment(
        compartmentData: ICompartmentBase,
        withDefinition: boolean = true
    ): void {
        this.cytoscapeObj.add({
            group: 'nodes',
            data: {
                name: compartmentData.name,
            },
            renderedPosition: {
                x: this.cytoscapeObj.width() / 2,
                y: this.cytoscapeObj.height() / 2,
            },
        });

        if (withDefinition) {
            this.addDefinition({
                name: compartmentData.name,
                type: DefinitionType.Compartment,
                value: compartmentData.value,
            });
        }
    }

    public editCompartment(compartmentData: IEditCompartmentPayload): void {
        const compartmentControl: FormGroup = this.getDefinitionControl(
            compartmentData.previousName || compartmentData.name
        );

        compartmentControl.controls['name'].setValue(compartmentData.name);
        compartmentControl.controls['value'].setValue(compartmentData.value);
    }

    public removeCompartment(): void {
        this.removeDefinition(this.selectedElement.data('name'));
    }

    public getConstants(): IConstant[] {
        return this.getDefinitionsTable().constants.map(
            (constant: IConstant): IConstant => ({
                name: constant.name,
                value: constant.value,
            })
        );
    }

    public getInterventions(): IIntervention[] {
        return this.getDefinitionsTable().interventions.map(
            (intervention: IIntervention): IIntervention => ({
                name: intervention.name,
            })
        );
    }

    public getCompartmentsBase(): ICompartmentBase[] {
        return this.getDefinitionsTable().compartments.map(
            (compartment: ICompartmentDefinition): ICompartmentBase => {
                return {
                    name: compartment.name,
                    value: compartment.value,
                };
            }
        );
    }

    public getCompartments(constants: IConstant[]): ICompartment[] {
        return this.getDefinitionsTable().compartments.map(
            (compartment: ICompartmentDefinition): ICompartment => {
                const compartmentNode: NodeSingular = this.cytoscapeObj
                    .nodes(`[name = "${compartment.name}"]`)
                    .first();

                return {
                    name: compartment.name,
                    value: compartment.value,
                    inflows: this.getFlowsEquations(
                        compartmentNode.incomers().edges()
                    ).map((flow: string): string => {
                        constants.forEach((constant: IConstant): void => {
                            flow = flow.replace(
                                new RegExp(`\\b${constant.name}\\b`),
                                constant.value.toString()
                            );
                        });

                        return flow;
                    }),
                    outflows: this.getFlowsEquations(
                        compartmentNode.outgoers().edges()
                    ).map((flow: string): string => {
                        constants.forEach((constant: IConstant): void => {
                            flow = flow.replace(
                                new RegExp(`\\b${constant.name}\\b`),
                                constant.value.toString()
                            );
                        });

                        return flow;
                    }),
                };
            }
        );
    }

    public getFlows(): IFlow[] {
        const flowEdges: EdgeCollection = this.cytoscapeObj.edges();

        return flowEdges.map(
            (flowEdge: EdgeSingular): IFlow => ({
                equation: flowEdge.data('equation'),
                source: flowEdge.source().data('name'),
                target: flowEdge.target().data('name'),
            })
        );
    }

    public addFlow(flowData: IFlow): void {
        const sourceNodeId: string = this.cytoscapeObj
            .nodes(`[name = "${flowData.source}"]`)
            .first()
            .id();
        const targetNodeId: string = this.cytoscapeObj
            .nodes(`[name = "${flowData.target}"]`)
            .first()
            .id();

        this.cytoscapeObj.add({
            group: 'edges',
            data: {
                source: sourceNodeId,
                target: targetNodeId,
                equation: flowData.equation,
            },
        });
    }

    public editFlow(flowEquation: string): void {
        const selectedFlow: EdgeSingular = this.selectedElement as EdgeSingular;

        selectedFlow.data('equation', flowEquation);
    }

    public removeFlow(): void {
        this.selectedElement.remove();
    }

    public getFlowsEquations(flowEdges: EdgeCollection): string[] {
        return flowEdges.map((flowEdge: EdgeSingular): string =>
            flowEdge.data('equation')
        );
    }

    public clear(removeConstants: boolean = false): void {
        const definitionsTable: IDefinitionsTable = this.getDefinitionsTable();

        definitionsTable.compartments.forEach(
            (compartment: ICompartmentDefinition): void => {
                this.removeDefinition(compartment.name);
            }
        );

        definitionsTable.interventions.forEach(
            (intervention: IInterventionDefinition): void => {
                this.removeDefinition(intervention.name);
            }
        );

        if (removeConstants) {
            definitionsTable.constants.forEach((constant: IConstant): void => {
                this.removeDefinition(constant.name);
            });
        }

        if (this.definitionsFormArray.length === 0) {
            this.definitionsFormArray.push(this.getNewDefinitionFormGroup());
        }

        this.definitionsFormArrayControlsSubject.next(
            this.definitionsFormArray.controls
        );
    }

    public addDefinition(definition: Definition): void {
        const newDefinitionFormGroup: FormGroup =
            this.getNewDefinitionFormGroup();

        newDefinitionFormGroup.patchValue(definition);

        this.definitionsFormArray.insert(-1, newDefinitionFormGroup);

        this.definitionsFormArrayControlsSubject.next(
            this.definitionsFormArray.controls
        );
    }

    public removeDefinition(definitionName: string): void {
        const definitionControl: FormGroup =
            this.getDefinitionControl(definitionName);
        const definitionType: DefinitionType = definitionControl.value.type;

        if (definitionType === DefinitionType.Compartment) {
            const compartmentNode: NodeSingular =
                this.getCompartmentNode(definitionName);

            compartmentNode.edges().remove();
            compartmentNode.remove();
        }

        const expressionRegExp: RegExp = new RegExp(
            `\\b${definitionName}\\b`,
            'g'
        );
        const modelFlows: EdgeCollection = this.cytoscapeObj
            .edges()
            .filter((edge: EdgeSingular): boolean =>
                edge.data('equation').match(expressionRegExp)
            );

        modelFlows.remove();

        this.definitionsFormArray.removeAt(
            this.definitionsFormArray.controls.indexOf(definitionControl)
        );

        if (this.definitionsFormArray.length === 0) {
            this.definitionsFormArray.push(this.getNewDefinitionFormGroup());
        }

        this.definitionsFormArrayControlsSubject.next(
            this.definitionsFormArray.controls
        );
    }

    public getDataSource(): DataSource<AbstractControl> {
        return {
            connect: (): Observable<AbstractControl[]> =>
                this.definitionsFormArrayControlsSubject.asObservable(),
            disconnect: (): void => {},
        };
    }

    public getDefinitionsTable(): IDefinitionsTable {
        const table: IDefinitionsTable = {
            compartments: [],
            interventions: [],
            constants: [],
        };

        this.definitionsFormArray.value.forEach(
            (definition: Definition): void => {
                switch (definition.type) {
                    case 'compartment':
                        table.compartments.push(definition);

                        break;

                    case 'intervention':
                        table.interventions.push(definition);

                        break;

                    case 'constant':
                        table.constants.push(definition);

                        break;
                }
            }
        );

        return table;
    }

    public getAvailableSymbols(): string[] {
        const availableSymbols: string[] = [];

        this.definitionsFormArray.value.forEach(
            (definition: Definition): void => {
                if (!definition.name) {
                    return;
                }

                availableSymbols.push(definition.name);
            }
        );

        return availableSymbols;
    }

    public definitionNameValidator(
        control: AbstractControl
    ): ValidationErrors | null {
        if (!control.value) {
            return null;
        }

        const existingCompartmentNames: string[] = this.getDefinitionsTable()
            .compartments.filter(
                (compartment: ICompartmentDefinition): boolean =>
                    compartment.name !== control.value
            )
            .map(
                (compartment: ICompartmentDefinition): string =>
                    compartment.name
            );

        return this.validationService.validateCompartmentName(
            control.value,
            existingCompartmentNames
        )
            ? null
            : {
                  compartmentName: {
                      valid: false,
                  },
              };
    }

    private getNewDefinitionFormGroup(): FormGroup {
        const nameFormControl: FormControl = new FormControl(null, [
            Validators.required,
            this.definitionNameValidator.bind(this),
        ]);
        const typeFormControl: FormControl = new FormControl(null, [
            Validators.required,
        ]);
        const valueFormControl: FormControl = new FormControl(null, [
            Validators.required,
            Validators.min(0),
        ]);

        typeFormControl.disable();
        valueFormControl.disable();

        const newDefinitionFormGroup: FormGroup = new FormGroup(
            {
                name: nameFormControl,
                type: typeFormControl,
                value: valueFormControl,
            },
            {
                updateOn: 'blur',
            }
        );

        const nameValueChangesSub: Subscription = nameFormControl.valueChanges
            .pipe(
                bufferCount<string>(2, 1),
                tap(([previousName, currentName]: string[]): void => {
                    if (currentName === '') {
                        return;
                    }

                    if (nameFormControl.valid) {
                        this.onDefinitionNameChange.apply(this, [
                            previousName,
                            currentName,
                            typeFormControl.value ===
                                DefinitionType.Compartment,
                        ]);

                        typeFormControl.enable({
                            emitEvent: false,
                        });

                        if (
                            typeFormControl.value === DefinitionType.Constant ||
                            typeFormControl.value === DefinitionType.Compartment
                        ) {
                            valueFormControl.enable({
                                emitEvent: false,
                            });
                        }

                        return;
                    }

                    typeFormControl.disable({
                        emitEvent: false,
                    });
                    valueFormControl.disable({
                        emitEvent: false,
                    });

                    nameFormControl.setValue(previousName);
                })
            )
            .subscribe();

        const typeValueChangesSub: Subscription = typeFormControl.valueChanges
            .pipe(
                tap((currentType: DefinitionType): void => {
                    if (currentType === DefinitionType.Intervention) {
                        valueFormControl.setValue(null);
                        valueFormControl.disable({
                            emitEvent: false,
                        });

                        return;
                    }

                    if (!valueFormControl.value) {
                        valueFormControl.setValue(0);
                    }

                    valueFormControl.enable({
                        emitEvent: false,
                    });
                }),
                bufferCount<DefinitionType>(2, 1),
                tap(([previousType, currentType]: DefinitionType[]): void => {
                    this.onDefinitionTypeChange.apply(this, [
                        nameFormControl.value,
                        previousType,
                        currentType,
                    ]);
                })
            )
            .subscribe();

        const groupValueChanges: Subscription =
            newDefinitionFormGroup.valueChanges
                .pipe(
                    filter(() => newDefinitionFormGroup.valid),
                    tap((): void => {
                        this.onDefinitionValueChanges.apply(this, [
                            newDefinitionFormGroup,
                        ]);
                    })
                )
                .subscribe();

        nameFormControl.setValue('');

        this.subscription.add(nameValueChangesSub);
        this.subscription.add(typeValueChangesSub);
        this.subscription.add(groupValueChanges);

        return newDefinitionFormGroup;
    }

    private onDefinitionNameChange(
        previousName: string,
        currentName: string,
        isCompartment: boolean = true
    ): void {
        if (isCompartment) {
            const compartmentNode: NodeSingular =
                this.getCompartmentNode(previousName);

            compartmentNode.data('name', currentName);
        }

        if (!previousName) {
            return;
        }

        const expressionRegExp: RegExp = new RegExp(
            `\\b${previousName}\\b`,
            'g'
        );
        const modelFlows: EdgeCollection = this.cytoscapeObj
            .edges()
            .filter((edge: EdgeSingular): boolean =>
                edge.data('equation').match(expressionRegExp)
            );

        modelFlows.forEach((flow: EdgeSingular): void => {
            flow.data(
                'equation',
                flow.data('equation').replace(expressionRegExp, currentName)
            );
        });
    }

    private onDefinitionTypeChange(
        definitionName: string,
        previousType: DefinitionType,
        currentType: DefinitionType
    ): void {
        if (
            previousType === currentType ||
            (previousType !== DefinitionType.Compartment &&
                currentType !== DefinitionType.Compartment)
        ) {
            return;
        }

        if (previousType === DefinitionType.Compartment) {
            const compartmentNode: NodeSingular =
                this.getCompartmentNode(definitionName);
            const modelFlows: EdgeCollection = compartmentNode.edges();

            modelFlows.remove();
            compartmentNode.remove();
        }

        if (currentType === DefinitionType.Compartment) {
            this.addCompartment(
                {
                    name: definitionName,
                    value: 0,
                },
                false
            );
        }
    }

    private onDefinitionValueChanges(definitionFormGroup: FormGroup): void {
        const index: number = this.definitionsFormArray.controls.findIndex(
            (control: AbstractControl): boolean =>
                control === definitionFormGroup
        );

        if (index === this.definitionsFormArray.length - 1) {
            this.definitionsFormArray.push(
                this.getNewDefinitionFormGroup.apply(this)
            );

            this.definitionsFormArrayControlsSubject.next(
                this.definitionsFormArray.controls
            );
        }
    }

    private getDefinitionControl(definitionName: string): FormGroup {
        return this.definitionsFormArray.controls.find(
            (control: AbstractControl): boolean =>
                control.value.name === definitionName
        ) as FormGroup;
    }

    private getCompartmentNode(compartmentName: string): NodeSingular {
        return this.cytoscapeObj.nodes(`[name = "${compartmentName}"]`).first();
    }
}
