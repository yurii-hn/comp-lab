def simulate(payload):
    """Model simulation function"""

    # Initialize the data dictionary
    data = {}

    # Setting output init data
    data['time'] = payload['simulationParameters']['time']
    data['step'] = payload['simulationParameters']['step']
    data['compartments'] = []

    # Get the amount of compartments
    compartmentsAmount = len(payload['model'])

    # Initialize the compartments with their initial values and symbols
    for i in range(compartmentsAmount):
        # Fetch the compartment from the model
        modelCompartment = payload['model'][i]

        # Initialize output compartment
        dataCompartment = {}

        # Initialize the compartment values
        dataCompartment['id'] = modelCompartment['id']
        dataCompartment['values'] = [0] * int(data['time'] / data['step'])

        # Set the initial value
        dataCompartment['values'][0] = modelCompartment['value']

        # Add the compartment to the output
        data['compartments'].append(dataCompartment)

    # Simulate the model
    for t in range(int(data['time'] / data['step']) - 1):
        # Initialize the compartment values list
        compartmentValues = {}

        for i in range(compartmentsAmount):
            compartmentId = payload['model'][i]['id']

            compartmentValues[compartmentId] = data['compartments'][i]['values'][t]

        # Calculate the new compartment values
        for i in range(compartmentsAmount):
            # Fetch the compartment from the model
            modelCompartment = payload['model'][i]

            # Get the amount of inflows and outflows
            compartmentInflows = len(modelCompartment['inflows'])
            compartmentOutflows = len(modelCompartment['outflows'])

            # Initialize the derivative
            d = ''

            # Calculate inflow part of the derivative
            for j in range(compartmentInflows):
                # Fetch the inflow from the compartment
                inflow = modelCompartment['inflows'][j].replace('^', '**')

                # Add the inflow to the derivative
                d += inflow

            # Calculate outflow part of the derivative
            for j in range(compartmentOutflows):
                # Fetch the outflow from the compartment
                outflow = modelCompartment['outflows'][j].replace('^', '**')

                # Subtract the outflow from the derivative
                d += f"-({outflow})"

            # Calculate the new compartment value
            data['compartments'][i]['values'][t + 1] = data['compartments'][i]['values'][t] + \
                eval(d, compartmentValues)

    return data
