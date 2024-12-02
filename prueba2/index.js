// Crear el mapa y agregar el control de pantalla completa
var mapa = L.map("contenedor-del-mapa", {
    fullscreenControl: true,
    fullscreenControlOptions: {
        position: 'topleft'
    }
}).setView([-12.056119215, -77.0843319000621], 16);

// Agregar capa base de OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png?", {}).addTo(mapa);

let startMarker, endMarker;
let startConnectionLayer, endConnectionLayer;
let grafo = {}; 
let senderosConectados; 

// Cargar el archivo GeoJSON de senderos y procesarlo
fetch('senderos_limpios.json')
    .then(response => response.json())
    .then(data => {
        senderosConectados = conectarSegmentos(data, 10); // Usar la función conectarSegmentos para limpiar el archivo JSON
        construirGrafo(senderosConectados); // Construir el grafo a partir de los senderos
    })
    .catch(error => console.error('Error al cargar el archivo GeoJSON:', error));

// Función para construir el grafo con las conexiones entre los puntos
function construirGrafo(geoJSON) {
    geoJSON.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            const startId = `${start[1]},${start[0]}`;
            const endId = `${end[1]},${end[0]}`;

            // Calcular la distancia entre los dos puntos
            const distance = turf.distance(turf.point(start), turf.point(end), { units: 'meters' });

            // Añadir las conexiones en ambas direcciones
            if (!grafo[startId]) grafo[startId] = [];
            if (!grafo[endId]) grafo[endId] = [];
            grafo[startId].push({ node: endId, weight: distance });
            grafo[endId].push({ node: startId, weight: distance });
        }
    });
}

// Función para encontrar el nodo más cercano a un punto dado
function encontrarNodoMasCercano(latlng) {
    let closestNode = null;
    let minDistance = Infinity;
    const point = turf.point([latlng.lng, latlng.lat]);

    for (const node in grafo) {
        const [lat, lng] = node.split(',').map(Number);
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
        // Crear el contenedor de los botones
        var container = L.DomUtil.create('div', 'leaflet-control-buttons');

        // Botón para seleccionar puntos
        var selectPointsBtn = L.DomUtil.create('button', '', container);
        selectPointsBtn.innerHTML = 'Seleccionar Puntos';
        selectPointsBtn.onclick = function(e) {
            // Detener la propagación del evento de clic al mapa
            L.DomEvent.stopPropagation(e);
            
            // Desactivar otros controles, si es necesario
            startMarker = null;
            endMarker = null;
            startConnectionLayer = null;
            endConnectionLayer = null;
            
            // Habilitar la selección de puntos
            mapa.on('click', seleccionarPuntos);
        };

        // Función para manejar la selección de puntos
        function seleccionarPuntos(e) {
            const clickedLatLng = e.latlng;
            const closestNode = encontrarNodoMasCercano(clickedLatLng);
            
            if (closestNode) {
                const [closestLat, closestLng] = closestNode.split(',').map(Number);
                const closestLatLng = L.latLng(closestLat, closestLng);

                if (!startMarker) {
                    // Primer clic, establecer como inicio
                    startMarker = L.marker(clickedLatLng, { draggable: false }).addTo(mapa).bindPopup("Inicio").openPopup();

                    // Eliminar la línea de conexión anterior
                    if (startConnectionLayer) {
                        mapa.removeLayer(startConnectionLayer);
                    }
                    startConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                        color: 'red',
                        weight: 2,
                        dashArray: '5, 5'
                    }).addTo(mapa);
                } else if (!endMarker) {
                    // Segundo clic, establecer como final
                    endMarker = L.marker(clickedLatLng, { draggable: false }).addTo(mapa).bindPopup("Final").openPopup();

                    // Eliminar la línea de conexión anterior
                    if (endConnectionLayer) {
                        mapa.removeLayer(endConnectionLayer);
                    }
                    endConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                        color: 'red',
                        weight: 2,
                        dashArray: '5, 5'
                    }).addTo(mapa);

                    // Calcular la ruta automáticamente
                    calcularRuta(startMarker.getLatLng(), endMarker.getLatLng());
                    
                    // Desactivar el clic del mapa
                    mapa.off('click', seleccionarPuntos);
                }
            }
        }

        // Botón para reiniciar ubicaciones
        var resetBtn = L.DomUtil.create('button', '', container);
        resetBtn.innerHTML = 'Reiniciar Ubicaciones';
        resetBtn.onclick = function(e) {
            // Detener la propagación del evento de clic al mapa
            L.DomEvent.stopPropagation(e);

            // Eliminar las capas de los marcadores
            if (startMarker) {
                mapa.removeLayer(startMarker);
                startMarker = null;
            }
            if (endMarker) {
                mapa.removeLayer(endMarker);
                endMarker = null;
            }

            // Eliminar las líneas de conexión de ambos puntos (start y end)
            if (startConnectionLayer) {
                mapa.removeLayer(startConnectionLayer);
                startConnectionLayer = null;
            }
            if (endConnectionLayer) {
                mapa.removeLayer(endConnectionLayer);
                endConnectionLayer = null;
            }

            // Limpiar la distancia mostrada
            const distanceElement = document.getElementById('distance-value');
            if (distanceElement) {
                distanceElement.textContent = "0 km";
            }
        };

        // Crear el elemento de distancia
        var distanceDisplay = L.DomUtil.create('div', 'distance-display', container);
        distanceDisplay.id = 'distance-display';
        distanceDisplay.innerHTML = '<strong>Distancia:</strong> <span id="distance-value">0 km</span>';

        return container;
    }
});

// Añadir el control de botones al mapa
mapa.addControl(new L.control.buttons({ position: 'topright' }));