""""Processing Type Enum"""

from enum import Enum


class ProcessingType(Enum):
    """Processing Type"""

    SIMULATION = "Simulation"
    OPTIMAL_CONTROL = "OptimalControl"
    PI = "PI"
