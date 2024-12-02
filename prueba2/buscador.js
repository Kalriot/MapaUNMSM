// Obtener el campo de búsqueda
const searchInput = document.getElementById("search-routes");
const suggestionsList = document.getElementById("suggestions-list");

// Variable global para almacenar las rutas desde el GeoJSON
let rutas = [];

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
    })
    .catch(error => console.error('Error al cargar el GeoJSON:', error));

// Función para mostrar las recomendaciones basadas en lo que el usuario escribe
function showSuggestions(query) {
    const filteredRutas = rutas.filter(ruta =>
        ruta.name.toLowerCase().includes(query.toLowerCase()) // Filtrar por nombre
    );

    // Limpiar las recomendaciones anteriores
    suggestionsList.innerHTML = "";

    // Mostrar las nuevas recomendaciones
    filteredRutas.forEach(ruta => {
        const li = document.createElement("li");
        li.textContent = ruta.name; // Mostrar el nombre de la facultad como sugerencia
        li.onclick = () => selectSuggestion(ruta); // Seleccionar con clic
        suggestionsList.appendChild(li);
    });
}

// Función para seleccionar una ruta
function selectSuggestion(ruta) {
    console.log("Ruta seleccionada:", ruta); // Agrega un log para ver qué ruta se ha seleccionado

    searchInput.value = ruta.name;  // Rellenar con el nombre de la facultad
    suggestionsList.innerHTML = ""; // Limpiar recomendaciones

    // Hacer zoom sobre la ruta seleccionada
    const bounds = L.latLngBounds(ruta.feature.geometry.coordinates.map(coord => L.latLng(coord[1], coord[0])));
    console.log("Haciendo zoom sobre las coordenadas:", bounds); // Depuración: Verifica si se están calculando correctamente los límites del mapa

    mapa.fitBounds(bounds);
}

// Función para manejar el input del usuario
searchInput.addEventListener("input", (event) => {
    const query = event.target.value;
    if (query) {
        showSuggestions(query);
    } else {
        suggestionsList.innerHTML = ""; // Limpiar cuando el campo está vacío
    }
});

// Función para manejar el teclado (Tab y flechas)
searchInput.addEventListener("keydown", (event) => {
    const suggestions = Array.from(suggestionsList.getElementsByTagName("li"));
    const activeSuggestion = suggestions.find(s => s.classList.contains("active"));

    if (event.key === "Tab") {
        event.preventDefault();
        if (suggestions.length > 0) {
            const nextSuggestion = activeSuggestion ? activeSuggestion.nextElementSibling : suggestions[0];
            if (nextSuggestion) {
                nextSuggestion.classList.add("active");
                searchInput.value = nextSuggestion.textContent;
            }
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (activeSuggestion) activeSuggestion.classList.remove("active");
        const nextSuggestion = activeSuggestion ? activeSuggestion.nextElementSibling : suggestions[0];
        if (nextSuggestion) nextSuggestion.classList.add("active");
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (activeSuggestion) activeSuggestion.classList.remove("active");
        const prevSuggestion = activeSuggestion ? activeSuggestion.previousElementSibling : suggestions[suggestions.length - 1];
        if (prevSuggestion) prevSuggestion.classList.add("active");
    }
});

// Función para cerrar la lista de sugerencias si el usuario hace clic fuera del campo de búsqueda
document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.innerHTML = ""; // Limpiar sugerencias al hacer clic fuera
    }
});
