import {
  OptimalControlParameters,
  PIParameters,
  ProcessingType,
  SimulationParameters,
} from '@core/types/processing';
import { createActionGroup, props } from '@ngrx/store';

interface SimulationProps {
    parameters: SimulationParameters;
    mode: ProcessingType.Simulation;
}

interface OptimalControlProps {
    parameters: OptimalControlParameters;
    mode: ProcessingType.OptimalControl;
}

interface PIProps {
    parameters: PIParameters;
    mode: ProcessingType.PI;
}

type ProcessModelProps = SimulationProps | OptimalControlProps | PIProps;

export const ProcessingActions = createActionGroup({
    source: 'Processing Component',
    events: {
        'Process Model': props<ProcessModelProps>(),
    },
});
