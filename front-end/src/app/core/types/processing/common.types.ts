export enum ProcessingType {
    Simulation = 'Simulation',
    OptimalControl = 'OptimalControl',
    PI = 'PI',
}

export interface Data {
    times: number[];
    values: number[];
}
