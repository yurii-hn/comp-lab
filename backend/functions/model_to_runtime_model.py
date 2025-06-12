from classes.model.equation import Equation
from classes.model.model import Model
from classes.model.runtime_compartment import RuntimeCompartment
from classes.model.runtime_model import RuntimeModel


def model_to_runtime_model(model: Model) -> RuntimeModel:
    symbols: list[str] = [
        *[compartment["name"] for compartment in model["compartments"]],
        *[constant["name"] for constant in model["constants"]],
        *[intervention["name"] for intervention in model["interventions"]],
    ]

    runtime_compartments: dict[str, RuntimeCompartment] = {
        compartment["name"]: {
            **compartment,
            "equation": Equation(),
        }
        for compartment in model["compartments"]
    }

    for flow in model["flows"]:
        source: RuntimeCompartment = next(
            runtime_compartment
            for runtime_compartment in runtime_compartments.values()
            if runtime_compartment["id"] == flow["source"]
        )
        target: RuntimeCompartment = next(
            runtime_compartment
            for runtime_compartment in runtime_compartments.values()
            if runtime_compartment["id"] == flow["target"]
        )

        source["equation"].subtract_str(flow["equation"], symbols)
        target["equation"].add_str(flow["equation"], symbols)

    return {**model, "compartments": runtime_compartments}
