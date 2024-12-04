var mapa = L.map("contenedor-del-mapa", {
    fullscreenControl: true,
    fullscreenControlOptions: {
        position: 'topleft'
    }
}).setView([-12.056119215, -77.0843319000621], 17);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png?", {}).addTo(mapa);

let startMarker, endMarker;
let startConnectionLayer, endConnectionLayer;
let grafo = {}; 
let senderosConectados; 

fetch('senderos_limpios.json')
    .then(response => response.json())
    .then(data => {
        senderosConectados = conectarSegmentos(data, 10);
        construirGrafo(senderosConectados);
    })
    .catch(error => console.error('Error al cargar el archivo GeoJSON:', error));

function construirGrafo(geoJSON) {
    geoJSON.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            const startId = `${start[1]},${start[0]}`;
            const endId = `${end[1]},${end[0]}`;

            const distance = turf.distance(turf.point(start), turf.point(end), { units: 'meters' });

            if (!grafo[startId]) grafo[startId] = [];
            if (!grafo[endId]) grafo[endId] = [];
            grafo[startId].push({ node: endId, weight: distance });
            grafo[endId].push({ node: startId, weight: distance });
        }
    });
}

function encontrarNodoMasCercano(latLng) {
    let closestNode = null;
    let minDistance = Infinity;

    if (isNaN(latLng.lng) || isNaN(latLng.lat)) {
        console.error("Coordenadas no válidas:", latLng);
        return null;
    }

    const point = turf.point([latLng.lng, latLng.lat]);

    for (const node in grafo) {
        const [lat, lng] = node.split(',').map(Number);

        if (isNaN(lat) || isNaN(lng)) {
            console.error(`Coordenadas no válidas para el nodo: ${node}`);
            continue;
        }

        const distance = turf.distance(point, turf.point([lng, lat]), { units: 'meters' });

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}

L.control.buttons = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-control-buttons');

        var selectPointsBtn = L.DomUtil.create('button', '', container);
        selectPointsBtn.innerHTML = 'Seleccionar Puntos';
        selectPointsBtn.onclick = function(e) {
            L.DomEvent.stopPropagation(e);
            
            startMarker = null;
            endMarker = null;
            startConnectionLayer = null;
            endConnectionLayer = null;
            
            mapa.on('click', seleccionarPuntos);
        };

        function seleccionarPuntos(e) {
            const clickedLatLng = e.latlng;
            const closestNode = encontrarNodoMasCercano(clickedLatLng);
            
            if (closestNode) {
                const [closestLat, closestLng] = closestNode.split(',').map(Number);
                const closestLatLng = L.latLng(closestLat, closestLng);

                if (!startMarker) {
                    startMarker = L.marker(clickedLatLng, { draggable: false }).addTo(mapa).bindPopup("Inicio").openPopup();

                    if (startConnectionLayer) {
                        mapa.removeLayer(startConnectionLayer);
                    }
                    startConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                        color: 'red',
                        weight: 2,
                        dashArray: '5, 5'
                    }).addTo(mapa);
                } else if (!endMarker) {
                    endMarker = L.marker(clickedLatLng, { draggable: false }).addTo(mapa).bindPopup("Final").openPopup();

                    if (endConnectionLayer) {
                        mapa.removeLayer(endConnectionLayer);
                    }
                    endConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                        color: 'red',
                        weight: 2,
                        dashArray: '5, 5'
                    }).addTo(mapa);

                    calcularRuta(startMarker.getLatLng(), endMarker.getLatLng());
                    
                    mapa.off('click', seleccionarPuntos);
                }
            }
        }

        var resetBtn = L.DomUtil.create('button', '', container);
        resetBtn.innerHTML = 'Reiniciar Ubicaciones';
        resetBtn.onclick = function(e) {
            L.DomEvent.stopPropagation(e);

            if (startMarker) {
                mapa.removeLayer(startMarker);
                startMarker = null;
            }
            if (endMarker) {
                mapa.removeLayer(endMarker);
                endMarker = null;
            }

            if (startConnectionLayer) {
                mapa.removeLayer(startConnectionLayer);
                startConnectionLayer = null;
            }
            if (endConnectionLayer) {
                mapa.removeLayer(endConnectionLayer);
                endConnectionLayer = null;
            }

            if (rutaLayer) {
                mapa.removeLayer(rutaLayer);
                rutaLayer = null;
            }

            const distanceElement = document.getElementById('distance-value');
            if (distanceElement) {
                distanceElement.textContent = "0 km";
            }
        };

        var virtualTourBtn = L.DomUtil.create('button', '', container);
        virtualTourBtn.innerHTML = 'Comenzar Recorrido Virtual';
        virtualTourBtn.onclick = function(e) {
            L.DomEvent.stopPropagation(e);
            document.getElementById('virtual-tour-container').style.display = 'block';
        };

        var distanceDisplay = L.DomUtil.create('div', 'distance-display', container);
        distanceDisplay.id = 'distance-display';
        distanceDisplay.innerHTML = '<strong>Distancia:</strong> <span id="distance-value">0 km</span>';

        return container;
    }
});

L.Control.Search = L.Control.extend({
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-control-search');

        const searchStartInput = L.DomUtil.create('input', 'search-input', container);
        searchStartInput.id = 'search-start';
        searchStartInput.placeholder = 'Buscar facultad de inicio...';

        const suggestionsStartList = L.DomUtil.create('ul', 'suggestions-list', container);
        suggestionsStartList.id = 'suggestions-start';

        const searchEndInput = L.DomUtil.create('input', 'search-input', container);
        searchEndInput.id = 'search-end';
        searchEndInput.placeholder = 'Buscar facultad de destino...';

        const suggestionsEndList = L.DomUtil.create('ul', 'suggestions-list', container);
        suggestionsEndList.id = 'suggestions-end';

        const searchButton = L.DomUtil.create('button', 'search-button', container);
        searchButton.id = 'search-route';
        searchButton.textContent = 'Buscar';

        L.DomEvent.disableClickPropagation(container);

        return container;
    }
});

mapa.addControl(new L.Control.Search({ position: 'topleft' }));

mapa.addControl(new L.control.buttons({ position: 'topright' }));

let rutaLayer;

document.addEventListener('DOMContentLoaded', function() {
    initSearch();
});

document.getElementById('close-virtual-tour').onclick = function() {
    document.getElementById('virtual-tour-container').style.display = 'none';
};
