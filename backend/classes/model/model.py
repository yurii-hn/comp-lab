from typing import TypedDict

from classes.model.compartment import Compartment
from classes.model.constant import Constant
from classes.model.intervention import Intervention
from classes.model.flow import Flow


class Model(TypedDict):
    compartments: list[Compartment]
    constants: list[Constant]
    interventions: list[Intervention]
    flows: list[Flow]
