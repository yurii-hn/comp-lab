"""Optimal Control Result Class"""


from core.classes.common.values import Values
from core.definitions.optimal_control.result import OptimalControlResultDefinition


class OptimalControlResult:
    """Optimal Control Result"""

    compartments: list[Values]
    interventions: list[Values]
    approximated_interventions: list[Values]

    @property
    def definition(self) -> OptimalControlResultDefinition:
        """Definition"""

        return {
            'compartments': [
                compartment.definition
                for compartment in self.compartments
            ],
            'interventions': [
                intervention.definition
                for intervention in self.interventions
            ],
            'approximatedInterventions': [
                approximated_intervention.definition
                for approximated_intervention in self.approximated_interventions
            ]
        }

    def __init__(self, definition: OptimalControlResultDefinition) -> None:
        self.compartments = [
            Values(compartment)
            for compartment in definition['compartments']
        ]
        self.interventions = [
            Values(intervention)
            for intervention in definition['interventions']
        ]
        self.approximated_interventions = [
            Values(approximated_intervention)
            for approximated_intervention in definition['approximatedInterventions']
        ]
