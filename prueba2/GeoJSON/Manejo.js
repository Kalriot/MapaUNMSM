function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
  }
var info = L.control({position: 'bottomleft'});
  
info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); 
      this.update();
      return this._div;
  }; 
  
info.update = function (props) {
    this._div.innerHTML = '<h1>Facultad</h1>' +  
        (props && props.name  ? '<b>' + props.name + '</b><br />' : 'inserta una palabra');
};
function highlightFeature(e) {
    var layer = e.target;
    
    // Asegúrate de que la capa sea un tipo de capa que soporte setStyle
    if (layer.setStyle) {
        layer.setStyle({
            weight: 5,
            color: '#33ff53',
            dashArray: '',
            fillOpacity: 0.5
        });
    }

    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
  
    info.update();
  }
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
  }
function zoomToFeature(e) {
    mapa.fitBounds(e.target.getBounds());
  }
function highlightSelectedFeature(feature) {
    // Resetear el estilo de todas las capas
    geojson.eachLayer(layer => {
        geojson.resetStyle(layer);
    });

    // Encontrar la capa correspondiente a la feature seleccionada
    const layer = geojson.getLayers().find(layer => layer.feature === feature);

    if (layer) {
        layer.setStyle({
            weight: 5,
            color: '#33ff53',
            dashArray: '',
            fillOpacity: 0.5
        });

        layer.bringToFront();
        info.update(layer.feature.properties);
    }
}
geojson = L.geoJson(universidadUNMSM, {
    onEachFeature: onEachFeature,
    style: function(feature) {
        return {
            color: 'blue',      // Borde azul por defecto
            fillColor: 'white', 
            weight: 2         
        };
    }
  }).addTo(mapa);
  
info.addTo(mapa);
