// Función para dibujar las conexiones entre facultades
function dibujarConexiones(grafo, coordenadas) {
  // Crear un grupo para las capas de conexiones
  const conexionesLayerGroup = L.layerGroup().addTo(mapa);

  // Iterar sobre las conexiones del grafo
  for (const facultad1 in grafo) {
      for (const facultad2 in grafo[facultad1]) {
          // Obtener las coordenadas de cada facultad
          const coord1 = coordenadas[facultad1];
          const coord2 = coordenadas[facultad2];

          // Crear una línea entre las dos facultades
          const linea = L.polyline([coord1, coord2], {
              color: 'blue',  // Color de la línea
              weight: 2,      // Grosor de la línea
              opacity: 0.7    // Opacidad de la línea
          });

          // Agregar un popup opcional con la distancia
          const distancia = grafo[facultad1][facultad2].toFixed(2);  // Obtenemos la distancia de la conexión
          linea.bindPopup(`<b>Distancia: ${distancia} km</b>`);

          // Añadir la línea al grupo de conexiones
          conexionesLayerGroup.addLayer(linea);
      }
  }
}

// Llamar a la función para dibujar las conexiones en el mapa
dibujarConexiones(grafoFacultades, coordenadasFacultades);
