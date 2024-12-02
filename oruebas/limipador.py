import json

# Cargar el archivo GeoJSON original
with open("Datoslimpios.json", "r") as f:
    geojson_data = json.load(f)

# Filtrar los segmentos inválidos
filtered_features = [
    feature for feature in geojson_data["features"]
    if feature["geometry"]["type"] == "LineString" and len(feature["geometry"]["coordinates"]) >= 2
]

# Crear un nuevo objeto GeoJSON con las características filtradas
cleaned_geojson = {
    "type": "FeatureCollection",
    "features": filtered_features
}

# Guardar el archivo GeoJSON limpio
with open("senderos_limpios.json", "w") as f:
    json.dump(cleaned_geojson, f, indent=4)

print("El archivo GeoJSON ha sido limpiado y guardado como 'senderos_limpios.json'")
