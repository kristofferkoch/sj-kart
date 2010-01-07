var kart = (function () {
	      var epsg32633 = new OpenLayers.Projection("EPSG:32633");
	      var map, statkart, vector;
	      var init = function() {
		map = new OpenLayers.Map(
		  "kart",
		  {
		    projection:    epsg32633,
		    maxExtent:     new OpenLayers.Bounds(-2500000.0,3500000.0,3045984.0,9045984.0),
		    units:         "meter",
		    maxResolution: 2708,
		    numZoomLevels: 18
		  }
		);

		statkart = new OpenLayers.Layer.WMS(
		  "Sjø, hovedkart 2",
		  "http://opencache.statkart.no/gatekeeper/gk/gk.open",
		  {
		    layer: "sjo_hovedkart2",
		    format: "image/png"
		  }
		);

		vector = new OpenLayers.Layer.Vector(
		  "Informasjon"
		);

		map.addLayers([statkart, vector]);
		
		map.setCenter(new OpenLayers.LonLat(256361,6648083),8);

	      };
	      document.addEventListener("load", init, false);
	      return {

	      };
	    })();
