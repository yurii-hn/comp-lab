"""Optimal Control Request Body Class"""

from core.classes.model.model import Model
from core.classes.optimal_control.parameters import OptimalControlParameters
from core.definitions.optimal_control.request_body import \
    OptimalControlRequestBodyDefinition


class OptimalControlRequestBody:
    """Optimal Control Request Body"""

    parameters: OptimalControlParameters
    model: Model

    @property
    def definition(self) -> OptimalControlRequestBodyDefinition:
        """Definition"""

        return {
            "parameters": self.parameters.definition,
            "model": self.model.definition,
        }

    def __init__(self, definition: OptimalControlRequestBodyDefinition) -> None:
        self.parameters = OptimalControlParameters(definition["parameters"])
        self.model = Model(definition["model"])
