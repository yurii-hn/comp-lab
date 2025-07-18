from typing import TypedDict

from classes.common.interpolation_type import InterpolationType
from classes.optimal_control.intervention_boundaries import (
    InterventionBoundaries,
)


class InterventionParameters(TypedDict):
    nodesAmount: int
    interpolationType: InterpolationType
    boundaries: dict[str, InterventionBoundaries]
