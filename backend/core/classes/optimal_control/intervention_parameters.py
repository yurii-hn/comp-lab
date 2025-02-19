"""Intervention Parameters Class"""

from core.classes.optimal_control.intervention_boundaries import \
    InterventionBoundaries
from core.definitions.common.approximation_type import ApproximationType
from core.definitions.optimal_control.intervention_parameters import \
    InterventionParametersDefinition


class InterventionParameters:
    """Intervention Parameters"""

    nodes_amount: int
    approximation_type: ApproximationType
    boundaries: list[InterventionBoundaries]

    @property
    def definition(self) -> InterventionParametersDefinition:
        """Definition"""

        return {
            "nodesAmount": self.nodes_amount,
            "approximationType": self.approximation_type,
            "boundaries": [boundary.definition for boundary in self.boundaries],
        }

    def __init__(self, definition: InterventionParametersDefinition) -> None:
        self.nodes_amount = definition["nodesAmount"]
        self.approximation_type = ApproximationType(definition["approximationType"])
        self.boundaries = [
            InterventionBoundaries(boundary) for boundary in definition["boundaries"]
        ]
