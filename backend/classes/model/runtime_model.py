from classes.model.model import Model
from classes.model.runtime_compartment import RuntimeCompartment


class RuntimeModel(Model):
    compartments: dict[str, RuntimeCompartment]
