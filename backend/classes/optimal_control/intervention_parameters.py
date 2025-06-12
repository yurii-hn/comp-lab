from typing import TypedDict

from classes.common.approximation_type import ApproximationType
from classes.optimal_control.intervention_boundaries import (
    InterventionBoundaries,
)


class InterventionParameters(TypedDict):
    nodesAmount: int
    approximationType: ApproximationType
    boundaries: dict[str, InterventionBoundaries]
