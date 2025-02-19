"""InterventionBoundaries Class"""

from core.definitions.optimal_control.intervention_boundaries import \
    InterventionBoundariesDefinition


class InterventionBoundaries:
    """InterventionBoundaries Class"""

    id: str
    name: str
    upper_boundary: float
    lower_boundary: float

    @property
    def definition(self) -> InterventionBoundariesDefinition:
        """Definition"""

        return {
            "id": self.id,
            "name": self.name,
            "upperBoundary": self.upper_boundary,
            "lowerBoundary": self.lower_boundary,
        }

    def __init__(self, definition: InterventionBoundariesDefinition) -> None:
        self.id = definition["id"]
        self.name = definition["name"]
        self.upper_boundary = definition["upperBoundary"]
        self.lower_boundary = definition["lowerBoundary"]
