"""Simulation Success Response Class"""

from core.classes.model.model import Model
from core.classes.simulation.parameters import SimulationParameters
from core.classes.simulation.result import SimulationResult
from core.definitions.common.processing_type import ProcessingType
from core.definitions.simulation.success_response import \
    SimulationSuccessResponseDefinition


class SimulationSuccessResponse:
    """Simulation Success Response"""

    _type: ProcessingType = ProcessingType.SIMULATION
    parameters: SimulationParameters
    model: Model
    result: SimulationResult

    @property
    def definition(self) -> SimulationSuccessResponseDefinition:
        """Definition"""

        return {
            "type": self._type.value,
            "parameters": self.parameters.definition,
            "model": self.model.definition,
            "result": self.result.definition,
        }

    def __init__(self, definition: SimulationSuccessResponseDefinition) -> None:
        self.parameters = SimulationParameters(definition["parameters"])
        self.model = Model(definition["model"])
        self.result = SimulationResult(definition["result"])
