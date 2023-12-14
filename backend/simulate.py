from sympy import Symbol

from shared import getCompartmentsEquations, checkPopulationPreservation, simulateModel, checkModelEquationsContinuity

def simulate(payload):
    """Model simulation function"""

    # Initialize the data dictionary
    data = {}

    # Setting output init data
    data['time'] = payload['simulationParameters']['time']
    data['step'] = payload['simulationParameters']['step']
    data['compartments'] = []

    payload['symbolsTable'] = {}

    for i in range(len(payload['model'])):
        compartmentName = payload['model'][i]['name']

        payload['symbolsTable'][compartmentName] = Symbol(compartmentName)

    simulationNodesAmount = data['time'] / data['step']

    compartmentsEquations = getCompartmentsEquations(payload)

    for i in range(len(payload['model'])):
        payload['model'][i]['values'] = [payload['model'][i]['value']] + \
            [0] * int(simulationNodesAmount - 1)
        payload['model'][i]['equation'] = compartmentsEquations[i]

    continuityCheckResult = checkModelEquationsContinuity(payload)

    if continuityCheckResult['error']:
        return {
            'error': continuityCheckResult['error'],
            'success': False
        }

    populationPreservationCheckResult = checkPopulationPreservation(payload)

    if populationPreservationCheckResult['error']:
        return {
            'error': populationPreservationCheckResult['error'],
            'success': False
        }

    try:
        simulationResults = simulateModel(payload)

        for i in range(len(payload['model'])):
            payload['model'][i]['values'] = simulationResults[i]['values']

        for i in range(len(payload['model'])):
            data['compartments'].append({
                'name': payload['model'][i]['name'],
                'values': payload['model'][i]['values']
            })

        data['success'] = True

        return data

    except Exception as e:
        return {
            'error': str(e),
            'success': False
        }
