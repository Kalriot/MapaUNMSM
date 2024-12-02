
const map = L.map('map').setView([-12.0560, -77.0844], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let startMarker, endMarker;
let startConnectionLayer, endConnectionLayer;
let connectionLayer; 
let senderosConectados; 
let grafo = {}; 

fetch('senderos_limpios.json')
    .then(response => response.json())
    .then(data => {
        senderosConectados = conectarSegmentos(data, 10); 
        L.geoJSON(senderosConectados, { color: 'gray' }).addTo(map);

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

// Encontrar el nodo más cercano a un punto dado
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

// Añadir marcadores y conectar al punto más cercano del sendero al hacer clic
map.on('click', function(e) {
    if (!senderosConectados) {
        alert("Los senderos aún no se han cargado.");
        return;
    }

    const clickedLatLng = e.latlng;
    const closestNode = encontrarNodoMasCercano(clickedLatLng);

    if (closestNode) {
        const [closestLat, closestLng] = closestNode.split(',').map(Number);
        const closestLatLng = L.latLng(closestLat, closestLng);

        // Crear o mover el marcador en el punto exacto del clic
        if (!startMarker) {
            // Si no existe el marcador de inicio, crearlo
            startMarker = L.marker(clickedLatLng, { draggable: true }).addTo(map).bindPopup("Punto de inicio").openPopup();

            // Dibujar una línea de conexión para el marcador de inicio
            if (startConnectionLayer) {
                map.removeLayer(startConnectionLayer);
            }
            startConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                color: 'red',
                weight: 2,
                dashArray: '5, 5'
            }).addTo(map);
        } else if (!endMarker) {
            // Si ya existe el marcador de inicio, este clic crea el marcador de destino
            endMarker = L.marker(clickedLatLng, { draggable: true }).addTo(map).bindPopup("Punto de destino").openPopup();

            // Dibujar una línea de conexión para el marcador de destino
            if (endConnectionLayer) {
                map.removeLayer(endConnectionLayer);
            }
            endConnectionLayer = L.geoJSON(turf.lineString([[clickedLatLng.lng, clickedLatLng.lat], [closestLng, closestLat]]), {
                color: 'red',
                weight: 2,
                dashArray: '5, 5'
            }).addTo(map);
        }
    }
});


// Implementación del algoritmo de Dijkstra para encontrar la ruta más corta
function dijkstra(grafo, inicio, fin) {
    const nodos = new Set(Object.keys(grafo));
    const distancias = {};
    const anteriores = {};

    nodos.forEach(nodo => {
        distancias[nodo] = Infinity;
        anteriores[nodo] = null;
    });
    distancias[inicio] = 0;

    while (nodos.size) {
        let nodoActual = null;

        nodos.forEach(nodo => {
            if (!nodoActual || distancias[nodo] < distancias[nodoActual]) {
                nodoActual = nodo;
            }
        });

        if (nodoActual === fin) break;
        nodos.delete(nodoActual);

        grafo[nodoActual].forEach(({ node: vecino, weight }) => {
            const nuevaDistancia = distancias[nodoActual] + weight;
            if (nuevaDistancia < distancias[vecino]) {
                distancias[vecino] = nuevaDistancia;
                anteriores[vecino] = nodoActual;
            }
        });
    }

    const ruta = [];
    let actual = fin;

    while (actual) {
        ruta.push(actual);
        actual = anteriores[actual];
    }

    return ruta.reverse();
}

/// Calcular y visualizar la ruta entre los puntos de inicio y fin
document.getElementById('calculate-route').addEventListener('click', () => {
    if (startMarker && endMarker) {
        const startNode = encontrarNodoMasCercano(startMarker.getLatLng());
        const endNode = encontrarNodoMasCercano(endMarker.getLatLng());

        if (startNode && endNode) {
            const rutaNodos = dijkstra(grafo, startNode, endNode);

            if (rutaNodos.length > 1) {
                const rutaCoordenadas = rutaNodos.map(node => {
                    const [lat, lng] = node.split(',').map(Number);
                    return [lng, lat];
                });



                // Crear y agregar la línea de la ruta en el mapa
                const routeLine = turf.lineString(rutaCoordenadas);
                startConnectionLayer = L.geoJSON(routeLine, { color: 'blue' }).addTo(map);

                // Calcular la distancia y mostrarla en kilómetros
                const distanceKm = turf.length(routeLine, { units: 'kilometers' }).toFixed(2);
                document.getElementById('distance-value').textContent = distanceKm;
            } else {
                alert("No se pudo encontrar una ruta.");
            }
        }
    } else {
        alert("Por favor, selecciona ambos puntos en el mapa.");
    }
});

// Reiniciar los marcadores y la ruta
document.getElementById('reset-locations').addEventListener('click', () => {
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
    }
    if (startConnectionLayer) {
        map.removeLayer(startConnectionLayer);
        startConnectionLayer = null;
    }
    if (endConnectionLayer) {
        map.removeLayer(endConnectionLayer);
        endConnectionLayer = null;
    }
    document.getElementById('distance-value').textContent = "0";
});