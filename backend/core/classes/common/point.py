"""Point Class"""

from core.definitions.common.point import PointDefinition


class Point:
    """Point"""

    time: float
    value: float

    @property
    def definition(self) -> PointDefinition:
        """Definition"""

        return {"time": self.time, "value": self.value}

    def __init__(self, definition: PointDefinition) -> None:
        self.time = definition["time"]
        self.value = definition["value"]
