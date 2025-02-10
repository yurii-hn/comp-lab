export enum ProcessingType {
    Simulation = 'Simulation',
    OptimalControl = 'OptimalControl',
    PI = 'PI',
}

export interface Point {
    time: number;
    value: number;
}

export interface Values {
    name: string;
    values: Point[];
}
