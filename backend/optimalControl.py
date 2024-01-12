from sympy import Symbol

from shared import getCostFunction, getCompartmentsEquations, getHamiltonian, getInterventionDerivatives, getLambdaDerivatives, checkCostFunctionContinuity, checkModelEquationsContinuity, checkPopulationPreservation, simulateModel, lambdaSystem, updateUFunctions, costFunction


def optimalControl(payload):
    eps = 1e-3
    iterations = 0

    # Initialize the data dictionary
    data = {}

    # Setting output init data
    data['time'] = payload['simulationParameters']['time']
    data['step'] = payload['simulationParameters']['step']
    data['compartments'] = []

    payload['symbolsTable'] = {}

    # Put symbols in the payload
    for i in range(len(payload['model'])):
        compartmentName = payload['model'][i]['name']

        payload['symbolsTable'][compartmentName] = Symbol(compartmentName)

    for i in range(len(payload['interventions'])):
        interventionName = payload['interventions'][i]['name']

        payload['symbolsTable'][interventionName] = Symbol(interventionName)

    simulationNodesAmount = data['time'] / data['step']

    payload['costFunction'] = getCostFunction(payload)
    compartmentsEquations = getCompartmentsEquations(payload)

    for i in range(len(payload['model'])):
        payload['model'][i]['values'] = [payload['model'][i]['value']] + \
            [0] * int(simulationNodesAmount - 1)
        payload['model'][i]['equation'] = compartmentsEquations[i]

    payload['hamiltonian'] = getHamiltonian(payload)

    interventionDerivatives = getInterventionDerivatives(payload)

    for i in range(len(payload['interventions'])):
        payload['interventions'][i]['values'] = [
            0] * int(simulationNodesAmount)
        payload['interventions'][i]['equation'] = interventionDerivatives[i]

    lambdaDerivatives = getLambdaDerivatives(payload)

    payload['lambdas'] = []

    for i in range(len(payload['model'])):
        payload['lambdas'].append({
            'values': [0] * int(simulationNodesAmount),
            'equation': lambdaDerivatives[i]
        })

    modelEquationsContinuityCheckResult = checkModelEquationsContinuity(
        payload, True)

    if modelEquationsContinuityCheckResult['error']:
        return {
            'error': modelEquationsContinuityCheckResult['error'],
            'success': False
        }

    costFunctionContinuityCheckResult = checkCostFunctionContinuity(payload)

    if costFunctionContinuityCheckResult['error']:
        return {
            'error': costFunctionContinuityCheckResult['error'],
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

        previousCost = 0
        currentCost = costFunction(payload)

        while True:
            newLambdas = lambdaSystem(payload)

            for i in range(len(payload['model'])):
                payload['lambdas'][i]['values'] = newLambdas[i]

            interventionValues = updateUFunctions(payload)

            for i in range(len(payload['interventions'])):
                payload['interventions'][i]['values'] = interventionValues[i]

            for i in range(len(payload['model'])):
                payload['model'][i]['values'] = [payload['model'][i]['value']] + \
                    [0] * int(simulationNodesAmount - 1)

            simulationResults = simulateModel(payload)

            for i in range(len(payload['model'])):
                payload['model'][i]['values'] = simulationResults[i]['values']

            previousCost = currentCost
            currentCost = costFunction(payload)

            iterations += 1

            if abs(currentCost - previousCost) <= eps:
                break

        for i in range(len(payload['model'])):
            data['compartments'].append({
                'name': payload['model'][i]['name'],
                'values': payload['model'][i]['values']
            })

        for i in range(len(payload['interventions'])):
            data['compartments'].append({
                'name': payload['interventions'][i]['name'],
                'values': payload['interventions'][i]['values']
            })

        data['success'] = True

        return data

    except Exception as e:
        return {
            'error': str(e),
            'success': False
        }
