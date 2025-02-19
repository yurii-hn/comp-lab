"""Simulation Request Body Class"""

from core.classes.model.model import Model
from core.classes.simulation.parameters import SimulationParameters
from core.definitions.simulation.request_body import \
    SimulationRequestBodyDefinition


class SimulationRequestBody:
    """Simulation Request Body"""

    parameters: SimulationParameters
    model: Model

    @property
    def definition(self) -> SimulationRequestBodyDefinition:
        """Definition"""

        return {
            "parameters": self.parameters.definition,
            "model": self.model.definition,
        }

    def __init__(self, definition: SimulationRequestBodyDefinition) -> None:
        self.parameters = SimulationParameters(definition["parameters"])
        self.model = Model(definition["model"])
