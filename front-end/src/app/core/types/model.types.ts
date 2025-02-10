export interface Compartment {
    id: string;
    name: string;
    value: number;
}

export interface Constant {
    id: string;
    name: string;
    value: number;
}

export interface Intervention {
    id: string;
    name: string;
}

export interface Flow {
    id: string;
    source: string;
    target: string;
    equation: string;
}

export interface Model {
    compartments: Compartment[];
    constants: Constant[];
    interventions: Intervention[];
    flows: Flow[];
}
