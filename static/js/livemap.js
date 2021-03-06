$(document).ready(function() {
   var socket = io.connect('/');
   var geojsonLayer, circles; 
   var last_time = false;

   var europe = new L.LatLng(38, 30); // geographical point (longitude and latitude)
   var italy =  new L.LatLng(42.779275,12.733154);
   var modena = new L.LatLng(44.648628,10.912857);
   var world = new L.LatLng(0, 0);
   var cloudmade;

   // create map function
   var createMap = function() {
     var map = new L.Map('map');

     var hour = new Date().getHours();
     if ((hour >= 22 && hour <= 24) || (hour >= 0 && hour <= 7)) {
       map_id = 999;
     }
     else {
       map_id = 997;
     }

     cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/8618631df8af451ba9fcbc0d9fb7788d/' + map_id + '/256/{z}/{x}/{y}.png', {
           attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
           maxZoom: 18
     });

     map.setView(world, 2, true).addLayer(cloudmade);
     return map;
   }

   // global map instance
   var map = createMap();

   $('ul#main-menu a').click(function(e) {
    e.preventDefault();
    $this = $(this);

    // add active class
    $('ul#main-menu li').removeClass('active');
    $this.parent().addClass('active');
    var time = $this.attr('data-time');

    if (time) {
      $('.progress').fadeIn();

      // remove geojson layers
      geojsonLayer.clearLayers();
      circles.clearLayers();

      // send time to server
      socket.emit('time', time);
    }
    else {
/*    layer = last_time;
      coords = last_time.geometry.coordinates;
      lat = parseFloat(coords[1]),
      lng = parseFloat(coords[0]);

      var latlng = new L.LatLng(lat, lng, true);
      */
      //map.panTo(modena);
      //map.setZoom(4;
      map.setView(modena, 9, true).addLayer(cloudmade);
    }
   });

   // layer styler object
   // ex: http://stackoverflow.com/questions/3913103/javascript-object-literal-pattern-with-multiple-instances
   var setStyle = function(layer, properties) {
      var Styler =  {
        init: function() {
          this.layer = layer;
          this.properties = properties;
        },

        setRadius: function(radius) {
          this.layer.setRadius(radius);
        },

        setColor: function(color) {
          this.style = color;
        },

        config: function() {
          coords = this.layer._latlng;
          options = this.layer.options;
          if (properties.mag > 4.5) {
            this.layer.options.fillColor = '#FF0000'
            this.layer.options.weight = 2;
          }
          this.setRadius(properties.mag * 1.5);

          // create circle aroud marker
          var circleLocation = new L.LatLng(coords.lat, coords.lng),
              circleOptions = {
                  color: 'yellow',
                  fillColor: '#f03',
                  fillOpacity: 0.5,
                  weight: -1
              };
          var circle = new L.Circle(circleLocation, 250 * properties.mag, circleOptions);
          //circles.addLayer(circle);
        },
      }
      Styler.init();
      return Styler;
   }

    // feature parser
   function featureParse(feature, layer) {
      if (feature.properties && feature.properties.place) {
        // popup content
        var date = new Date(feature.properties.time * 1000);
        layer.bindPopup('<strong>Place: </strong> ' + feature.properties.place + '<br />' + 
                          '<strong>Date: </strong> ' + date +  '<br />' + 
                          '<strong>Magnitude: </strong>' + feature.properties.mag  + '<br />' + 
                          '<a target="_blank" href="http://earthquake.usgs.gov/' + feature.properties.url + '"> Informations </a>'
                         );

        if (feature.properties) {
          var mag = feature.properties.mag;
          var Styler = new setStyle(layer, feature.properties);
          layer = Styler.config();
        }
      }
   };

   /* Earthquake handler */
   socket.on('earthquakes', function (data) {
    var points = data.points;
    console.log(points);

    var geojsonMarkerOptions = {
      radius: 5,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    circles = new L.LayerGroup();
    geojsonLayer = new L.GeoJSON(points, {
        style: function (feature) {
          return feature.properties && feature.properties.style;
        },
        pointToLayer: function (feature, latlng) {
          return new L.CircleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: featureParse
    });
      
     //geojsonLayer.addGeoJSON(points);
     //map.addLayer(geojsonLayer);
     geojsonLayer.addTo(map);

     //map.addLayer(circles);
     // deactivate progress bar
     $('.progress').fadeOut();
   });
  

   // Twitter streaming
   socket.on('tweet', function (data) {
     tweet = data.tweet;
     if (tweet.coordinates) {
      console.log(tweet);
     }
     else {
      console.log('tweet non geolocalizzato');
     }
   });
  

});



