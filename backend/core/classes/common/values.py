"""Values Class"""

from core.classes.common.point import Point
from core.definitions.common.values import ValuesDefinition
from core.definitions.optimal_control.approximation_type import \
    ApproximationType


class Values:
    """Values"""

    name: str
    values: list[Point]
    approximation_type: ApproximationType

    @property
    def definition(self) -> ValuesDefinition:
        """Definition"""

        return {
            "name": self.name,
            "values": [value.definition for value in self.values],
        }

    def __init__(
        self,
        definition: ValuesDefinition,
        approximation_type: ApproximationType = ApproximationType.PIECEWISE_LINEAR,
    ) -> None:
        self.name = definition["name"]
        self.values = [Point(value) for value in definition["values"]]
        self.approximation_type = approximation_type

        self.values.sort(key=lambda value: value.time)

    def __call__(self, time: float) -> float:
        """Get value at time"""

        if self.approximation_type == ApproximationType.PIECEWISE_CONSTANT:
            return self.piecewise_constant_approximation(time)
        elif self.approximation_type == ApproximationType.PIECEWISE_LINEAR:
            return self.piecewise_linear_approximation(time)
        else:
            raise ValueError("Approximation type not supported")

    def piecewise_constant_approximation(self, time: float) -> float:
        """Piecewise constant approximation"""

        if len(self.values) == 0:
            return 0

        if time <= self.values[0].time:
            return self.values[0].value

        if time >= self.values[-1].time:
            return self.values[-1].value

        for i in range(len(self.values) - 1):
            if self.values[i].time <= time < self.values[i + 1].time:
                return self.values[i].value

        raise ValueError("How did you get here?")

    def piecewise_linear_approximation(self, time: float) -> float:
        """Piecewise linear approximation"""

        if len(self.values) == 0:
            return 0

        if time <= self.values[0].time:
            return self.values[0].value

        if time >= self.values[-1].time:
            return self.values[-1].value

        for i in range(len(self.values) - 1):
            time_left: float = self.values[i].time
            time_right: float = self.values[i + 1].time

            if time_left <= time < time_right:
                value_left: float = self.values[i].value
                value_right: float = self.values[i + 1].value

                return (time_right - time) / (time_right - time_left) * value_left + (
                    time - time_left
                ) / (time_right - time_left) * value_right

        raise ValueError("How did you get here?")
