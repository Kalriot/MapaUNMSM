// Inicializar el mapa centrado en UNMSM
const map = L.map('map').setView([-12.0566, -77.0844], 16);

// Agregar una capa de mapa desde OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Funciones de zoom
document.getElementById('zoom-in').addEventListener('click', () => {
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    map.zoomOut();
});

// Coordenadas para el contorno de la UNMSM
const sanMarcosPolygon = [
    [-12.056724, -77.090937],  // Esquina noroeste
    [-12.061122, -77.088882],  // Esquina suroeste
    [-12.062141, -77.083645],  // Esquina sureste
    [-12.057834, -77.080093],  // Esquina noreste
    [-12.054990, -77.084952],  // Esquina noroeste intermedia
    [-12.056724, -77.090937]   // Cerrar el polígono
];

// Dibujar el polígono con un contorno rojo alrededor del campus
L.polygon(sanMarcosPolygon, {
    color: 'red',
    weight: 4,
    fillColor: 'transparent',
    fillOpacity: 0.5
}).addTo(map);

// Coordenada específica (el punto resaltado en azul)
const targetLatLng = [-12.057486, -77.086209];

// Agregar un marcador azul en el punto destacado
const blueMarker = L.circleMarker(targetLatLng, {
    color: 'blue',
    radius: 10
}).addTo(map).bindPopup('Punto objetivo - Redirige a YouTube');

// Función para mostrar el modal
const modal = document.getElementById("myModal");
const closeModal = document.getElementsByClassName("close")[0];

function openModal() {
    modal.style.display = "block";
}
closeModal.onclick = function() {
    modal.style.display = "none";
}

// Función para activar el muñeco y detectar si lo arrastra al punto objetivo
function activateStreetView() {
    const orangeManIcon = L.icon({
        iconUrl: 'kirby.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50]
    });

    const manMarker = L.marker(map.getCenter(), { icon: orangeManIcon, draggable: true }).addTo(map)
        .bindPopup('Arrastra el muñeco al punto objetivo');

    manMarker.on('dragend', function(event) {
        const markerLatLng = manMarker.getLatLng();

        // Verifica si el muñeco se arrastró cerca del punto objetivo
        const latDiff = Math.abs(markerLatLng.lat - targetLatLng[0]);
        const lngDiff = Math.abs(markerLatLng.lng - targetLatLng[1]);

        if (latDiff < 0.0001 && lngDiff < 0.0001) {
            openModal();  // Abre el modal en lugar de redirigir
        }
    });
}
