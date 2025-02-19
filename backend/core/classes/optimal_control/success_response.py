"""Optimal Control Success Response Class"""

from core.classes.model.model import Model
from core.classes.optimal_control.parameters import OptimalControlParameters
from core.classes.optimal_control.result import OptimalControlResult
from core.classes.simulation.result import SimulationResult
from core.definitions.common.approximation_type import ApproximationType
from core.definitions.common.processing_type import ProcessingType
from core.definitions.optimal_control.success_response import \
    OptimalControlSuccessResponseDefinition


class OptimalControlSuccessResponse:
    """Optimal Control Success Response"""

    _type: ProcessingType = ProcessingType.OPTIMAL_CONTROL
    parameters: OptimalControlParameters
    model: Model
    result: tuple[SimulationResult, OptimalControlResult]

    @property
    def definition(self) -> OptimalControlSuccessResponseDefinition:
        """Definition"""

        return {
            "type": self._type.value,
            "parameters": self.parameters.definition,
            "model": self.model.definition,
            "result": (self.result[0].definition, self.result[1].definition),
        }

    def __init__(
        self,
        definition: OptimalControlSuccessResponseDefinition,
        interventions_approximation_type: ApproximationType,
    ) -> None:
        self.parameters = OptimalControlParameters(definition["parameters"])
        self.model = Model(definition["model"])
        self.result = (
            SimulationResult(definition["result"][0]),
            OptimalControlResult(
                definition["result"][1], interventions_approximation_type
            ),
        )
