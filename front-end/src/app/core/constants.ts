import * as cytoscape from 'cytoscape';

export const cytoscapeOptions: cytoscape.CytoscapeOptions = {
    minZoom: 0.1,
    maxZoom: 3,
    zoom: 1,
    wheelSensitivity: 0.2,
    style: [
        {
            selector: 'node',
            style: {
                label: 'data(id)',
            },
        },
    ],
    boxSelectionEnabled: false,
    styleEnabled: true,
};

export const cytoscapeLayoutOptions: cytoscape.LayoutOptions = {
    name: 'grid',
    fit: false,
};
