function data=simulate(modelJson)
    % Parse the model to a struct
    model = jsondecode(modelJson);

    % Initialize the data struct
    data = struct();

    % Setting output init data
    data.time = model.simulationParameters.time;
    data.step = model.simulationParameters.step;
    data.compartments = {};

    % Get the amount of compartments
    compartmentsAmount = numel(model.compartments);

    % Initialize the compartment symbols array
    compartmentSymbols = cell(1, compartmentsAmount);

    % Initialize the compartments with their initial values and symbols
    for i = 1:compartmentsAmount
        % Fetch the compartment from the model
        compartment = model.compartments(i);

        % Initialize the compartment values
        data.compartments = [data.compartments, zeros(1, data.time/data.step)];

        % Set the initial value
        data.compartments{i}(1) = compartment.initial;

        % Set the symbol
        compartmentSymbols{i} = sym(compartment.id);
    end

    % Simulate the model
    for t = 1:data.time/data.step - 1
        % Initialize the compartment values array
        compartmentValues = cell(1, compartmentsAmount);

        % Set the compartment values
        for i = 1:compartmentsAmount
            compartmentValues{i} = data.compartments{i}(t);
        end

        % Calculate the new compartment values
        for i = 1:compartmentsAmount
            % Fetch the compartment from the model
            compartment = model.compartments(i);

            % Get the amount of inflows and outflows
            compartmentInflows = numel(compartment.inflows);
            compartmentOutflows = numel(compartment.outflows);

            % Initialize the derivative
            d = 0;

            % Calculate inflow part of the derivative
            for j = 1:compartmentInflows
                % Fetch the inflow from the compartment
                inflow = compartment.inflows(j);

                % Add the inflow to the derivative
                d = d + inflow.ratio * str2sym(inflow.value);
            end

            % Calculate outflow part of the derivative
            for j = 1:compartmentOutflows
                % Fetch the outflow from the compartment
                outflow = compartment.outflows(j);

                % Subtract the outflow from the derivative
                d = d - outflow.ratio * str2sym(outflow.value);
            end

            % Calculate the new compartment value
            data.compartments{i}(t + 1) = data.compartments{i}(t) + eval(subs(d, compartmentSymbols, compartmentValues));
        end
    end
end
