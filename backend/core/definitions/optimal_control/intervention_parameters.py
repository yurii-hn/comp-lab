"""Intervention Parameters Definition"""

from typing import TypedDict

from core.definitions.common.approximation_type import ApproximationType
from core.definitions.optimal_control.intervention_boundaries import \
    InterventionBoundariesDefinition


class InterventionParametersDefinition(TypedDict):
    """Intervention Parameters Definition"""

    nodesAmount: int
    approximationType: ApproximationType
    boundaries: list[InterventionBoundariesDefinition]
