// Obtener los campos de búsqueda
const searchStartInput = document.getElementById("search-start");
const suggestionsStartList = document.getElementById("suggestions-start");
const searchEndInput = document.getElementById("search-end");
const suggestionsEndList = document.getElementById("suggestions-end");

// Variable global para almacenar las rutas desde el GeoJSON
let rutas = [];

const puntosfacultades = {
    "facultades": [
        {
            "nombre": "Facultad de Letras y Ciencias Humanas",
            "coordenadas": [-12.057463861581558, -77.08146536455192]
        },
        {
            "nombre": "Facultad de Ciencias Administrativas",
            "coordenadas": [-12.057831548969945, -77.08142771240423]
        },
        {
            "nombre": "Facultad de Ciencias Económicas",
            "coordenadas": [-12.058064327341, -77.08122303399627]
        },
        {
            "nombre": "Facultad de Derecho y Ciencia Política",
            "coordenadas": [-12.058646485036896, -77.08066141016164]
        },
        {
            "nombre": "Facultad de Ciencias Sociales",
            "coordenadas": [
                [-12.057979339800296, -77.08164663159106],
                [-12.05845963344347, -77.0821362289589]
            ]
        },
        {
            "nombre": "Rectorado UNMSM",
            "coordenadas": [-12.056420721843532, -77.08637776780245]
        },
        {
            "nombre": "Facultad de Ingeniería de Sistemas e Informática",
            "coordenadas": [-12.053674637174703, -77.08578097418183]
        },
        {
            "nombre": "Facultad de Ciencias Biológicas",
            "coordenadas": [
                [-12.059648837479825, -77.0821371017456],
                [-12.059893629177834, -77.08211055273979]
            ]
        },
        {
            "nombre": "Facultad de Ciencias Matemáticas",
            "coordenadas": [
                [-12.060530917062469, -77.08232638492699],
                [-12.060153274324263, -77.08202416795078]
            ]
        },
        {
            "nombre": "Facultad de Ingeniería Industrial",
            "coordenadas": [
                [-12.059479921409936, -77.08086055157021],
                [-12.059874347379367, -77.0815336247964],
                [-12.06019828917936, -77.0809475621372]
            ]
        },
        {
            "nombre": "Facultad de Química e Ingeniería Química",
            "coordenadas": [
                [-12.06008285894848, -77.08380493019877],
                [-12.060312599093503, -77.08322166748582],
                [-12.06044428759681, -77.08383287641603]
            ]
        },
        {
            "nombre": "E.P. de Ingeniería de Minas",
            "coordenadas": [-12.052223155266663, -77.08761693392692]
        },
        {
            "nombre": "Instituto de Medicina Tropical",
            "coordenadas": [
                [-12.053956664971171, -77.08728268866007],
                [-12.054146209481669, -77.0875649478706],
                [-12.054284227242904, -77.08725446274323]
            ]
        }
    ]
};

// Función para cargar el GeoJSON y extraer las rutas (por ejemplo, usando @id)
fetch('DatFacultades.json')
    .then(response => response.json())
    .then(data => {
        // Extraer las rutas, en este caso por el nombre de la facultad
        data.features.forEach(feature => {
            if (feature.properties && feature.properties.name) {  // Aseguramos que el nombre esté presente
                rutas.push({
                    name: feature.properties.name, // Almacenamos el nombre de la facultad
                    feature: feature // Almacenamos la feature completa
                });
            }
        });

        // Mostrar todos los 'properties.name' en el console.log
        console.log("Lista de todas las facultades:");
        rutas.forEach(ruta => {
            console.log(ruta.name);  // Muestra el nombre de cada facultad
        });
    })
    .catch(error => console.error('Error al cargar el GeoJSON:', error));

// Función para mostrar las recomendaciones basadas en lo que el usuario escribe
function showSuggestions(query, suggestionsList) {
    const filteredRutas = rutas.filter(ruta =>
        ruta.name.toLowerCase().includes(query.toLowerCase()) // Filtrar por nombre
    );

    // Limpiar las recomendaciones anteriores
    suggestionsList.innerHTML = "";

    // Mostrar las nuevas recomendaciones, asegurándose de que solo se muestre un punto por nombre
    const uniqueNames = new Set();
    filteredRutas.forEach(ruta => {
        if (!uniqueNames.has(ruta.name)) {
            uniqueNames.add(ruta.name);
            const li = document.createElement("li");
            li.textContent = ruta.name; // Mostrar el nombre de la facultad como sugerencia
            li.onclick = () => selectSuggestion(ruta, suggestionsList); // Seleccionar con clic
            suggestionsList.appendChild(li);
        }
    });
}

// Función para seleccionar una facultad
function selectSuggestion(ruta, suggestionsList) {
    console.log(ruta.name);  // Depuración: Ver nombre de la facultad seleccionada

    // Obtener las coordenadas de la facultad (si son un 'Polygon' o 'Point')
    const coords = ruta.feature.geometry.coordinates;
    let latLngs;
    if (Array.isArray(coords[0])) {
        // Si las coordenadas son de un 'Polygon', convertir cada par de coordenadas a L.latLng
        latLngs = coords[0].map(coord => L.latLng(coord[1], coord[0]));  // Invertir lat y lng en Leaflet
    } else {
        // Si es un solo punto (Point), usar directamente las coordenadas
        latLngs = [L.latLng(coords[1], coords[0])];  // Invertir lat y lng en Leaflet
    }

    // Rellenar el input con el nombre y las coordenadas correspondientes
    if (suggestionsList === suggestionsStartList) {
        searchStartInput.value = ruta.name;
        searchStartInput.dataset.coords = JSON.stringify(latLngs);  // Almacenar las coordenadas
    } else {
        searchEndInput.value = ruta.name;
        searchEndInput.dataset.coords = JSON.stringify(latLngs);  // Almacenar las coordenadas
    }

    suggestionsList.innerHTML = ""; // Limpiar sugerencias

    // Realiza zoom sobre las coordenadas seleccionadas
    const bounds = L.latLngBounds(latLngs);
    mapa.fitBounds(bounds);

    // Llamada para calcular la ruta más corta entre los puntos
}

// Función para manejar el input del usuario
searchStartInput.addEventListener("input", (event) => {
    const query = event.target.value;
    if (query) {
        showSuggestions(query, suggestionsStartList);
    } else {
        suggestionsStartList.innerHTML = ""; // Limpiar cuando el campo está vacío
    }
});

searchEndInput.addEventListener("input", (event) => {
    const query = event.target.value;
    if (query) {
        showSuggestions(query, suggestionsEndList);
    } else {
        suggestionsEndList.innerHTML = ""; // Limpiar cuando el campo está vacío
    }
});

// Función para manejar el teclado (Tab y flechas)
function handleKeyDown(event, suggestionsList, searchInput) {
    const suggestions = Array.from(suggestionsList.getElementsByTagName("li"));
    const activeSuggestion = suggestions.find(s => s.classList.contains("active"));

    if (event.key === "Tab") {
        event.preventDefault();
        if (suggestions.length > 0) {
            const nextSuggestion = activeSuggestion ? activeSuggestion.nextElementSibling : suggestions[0];
            if (nextSuggestion) {
                if (activeSuggestion) activeSuggestion.classList.remove("active");
                nextSuggestion.classList.add("active");
                searchInput.value = nextSuggestion.textContent; // Rellenar automáticamente
                nextSuggestion.scrollIntoView({ block: "nearest" }); // Desplazamiento automático
            }
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (activeSuggestion) activeSuggestion.classList.remove("active");
        const nextSuggestion = activeSuggestion ? activeSuggestion.nextElementSibling : suggestions[0];
        if (nextSuggestion) {
            nextSuggestion.classList.add("active");
            searchInput.value = nextSuggestion.textContent; // Rellenar automáticamente
            nextSuggestion.scrollIntoView({ block: "nearest" }); // Desplazamiento automático
        }
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (activeSuggestion) activeSuggestion.classList.remove("active");
        const prevSuggestion = activeSuggestion ? activeSuggestion.previousElementSibling : suggestions[suggestions.length - 1];
        if (prevSuggestion) {
            prevSuggestion.classList.add("active");
            searchInput.value = prevSuggestion.textContent; // Rellenar automáticamente
            prevSuggestion.scrollIntoView({ block: "nearest" }); // Desplazamiento automático
        }
    } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeSuggestion) {
            const ruta = rutas.find(r => r.name === activeSuggestion.textContent);
            if (ruta) selectSuggestion(ruta, suggestionsList); // Seleccionar la sugerencia activa
        }
    }
}

searchStartInput.addEventListener("keydown", (event) => handleKeyDown(event, suggestionsStartList, searchStartInput));
searchEndInput.addEventListener("keydown", (event) => handleKeyDown(event, suggestionsEndList, searchEndInput));

// Función para cerrar la lista de sugerencias si el usuario hace clic fuera del campo de búsqueda
document.addEventListener("click", (event) => {
    if (!searchStartInput.contains(event.target) && !suggestionsStartList.contains(event.target)) {
        suggestionsStartList.innerHTML = ""; // Limpiar sugerencias al hacer clic fuera
    }
    if (!searchEndInput.contains(event.target) && !suggestionsEndList.contains(event.target)) {
        suggestionsEndList.innerHTML = ""; // Limpiar sugerencias al hacer clic fuera
    }
});

// Obtener el botón de búsqueda
const searchRouteButton = document.getElementById("search-route");
// Función para manejar el clic en el botón de búsqueda
searchRouteButton.addEventListener("click", () => {
    const startName = searchStartInput.value;
    const endName = searchEndInput.value;

    if (startName && endName) {
        const startCoords = JSON.parse(searchStartInput.dataset.coords);
        const endCoords = JSON.parse(searchEndInput.dataset.coords);

        if (startCoords && endCoords) {
            // Verificar si las coordenadas son válidas y convertirlas a formato adecuado
            const startLatLng = startCoords[0];
            const endLatLng = endCoords[0];

            calcularRuta(startLatLng, endLatLng);
        } else {
            alert("Por favor, seleccione facultades válidas.");
        }
    } else {
        alert("Por favor, complete ambos campos de búsqueda.");
    }
});

// Función para calcular la ruta más corta entre los puntos de inicio y fin
function calcularRuta(startLatLng, endLatLng) {
    // Validar que startLatLng y endLatLng tengan propiedades lng y lat que sean números
    if (isNaN(startLatLng.lng) || isNaN(startLatLng.lat) || isNaN(endLatLng.lng) || isNaN(endLatLng.lat)) {
        console.error("Coordenadas no válidas:", startLatLng, endLatLng);
        return;
    }

    const startNode = encontrarNodoMasCercano(startLatLng);
    const endNode = encontrarNodoMasCercano(endLatLng);

    if (startNode && endNode) {
        const rutaNodos = dijkstra(grafo, startNode, endNode);

        if (rutaNodos.length > 1) {
            const rutaCoordenadas = rutaNodos.map(node => {
                const [lat, lng] = node.split(',').map(Number);
                return [lng, lat];
            });

            // Crear la nueva línea de la ruta (la ruta calculada)
            const routeLine = turf.lineString(rutaCoordenadas);

            // Crear la nueva capa de la ruta en el mapa
            if (rutaLayer) {
                mapa.removeLayer(rutaLayer);
            }
            rutaLayer = L.geoJSON(routeLine, { color: 'blue' }).addTo(mapa);

            // Calcular la distancia y mostrarla en kilómetros
            const distanceKm = turf.length(routeLine, { units: 'kilometers' }).toFixed(2);

            // Asegurarse de que el elemento de distancia esté disponible
            const distanceElement = document.getElementById('distance-value');
            if (distanceElement) {
                distanceElement.textContent = `${distanceKm} km`;
            } else {
                console.error("Elemento para mostrar la distancia no encontrado");
            }
        } else {
            alert("No se pudo encontrar una ruta.");
        }
    }
}