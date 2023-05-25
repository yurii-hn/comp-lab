export interface IFlow {
    ratio: number;
    value: string;
}

export interface ICompartmentBase {
    id: string;
    initialValue: number;
}

export interface ICompartment extends ICompartmentBase {
    inflows: IFlow[];
    outflows: IFlow[];
}

export interface ISimulationParameters {
    time: number;
    step: number;
}

export interface IModel {
    compartments: ICompartment[];
    simulationParameters: ISimulationParameters;
}

export interface ICompartmentSimulatedData {
    id: string;
    values: number[];
}

export interface ISimulationResults {
    time: number;
    step: number;
    compartments: ICompartmentSimulatedData[];
}
