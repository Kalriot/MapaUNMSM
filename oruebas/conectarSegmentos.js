
function conectarSegmentos(geoJSON, umbralDistancia) {
    const features = geoJSON.features;
    const conexiones = []; // Almacena las conexiones únicas

    features.forEach((featureA, index) => {
        const coordsA = featureA.geometry.coordinates;

        if (!coordsA || coordsA.length < 2) return;

        const endPointA = coordsA[coordsA.length - 1];

        features.slice(index + 1).forEach(featureB => {
            const coordsB = featureB.geometry.coordinates;

            if (!coordsB || coordsB.length < 2) return;

            const startPointB = coordsB[0];

            const distancia = turf.distance(turf.point(endPointA), turf.point(startPointB), { units: 'meters' });

            if (distancia <= umbralDistancia) {
                const lineaConexion = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [endPointA, startPointB]
                    },
                    properties: { connected: true }
                };
                conexiones.push(lineaConexion);
            }
        });
    });

    return {
        type: "FeatureCollection",
        features: [...features, ...conexiones]
    };
}