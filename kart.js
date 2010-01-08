var kart = (function () {
	      var statProj = new OpenLayers.Projection("EPSG:32633"),
		stdProj = new OpenLayers.Projection("EPSG:4326");
	      // Private variabler
	      var map, // OpenLayers.Map kart
		statkart, // WMS-lag med sjøkartfliser fra statkart
		vector; // Vektor-lag med "aktiv" informasjon

	      // Private funksjoner
	      var init = function() {
		map = new OpenLayers.Map('kart', {
			projection: new OpenLayers.Projection("EPSG:900913"),
			//displayProjection: stdProj,
		        maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
			units: "m",
			maxResolution: 156543.0339,
			numZoomLevels: 12,
			controls: [
			  new OpenLayers.Control.Graticule({numPoints:2,
							    labelled:true,
							    visible:true
							   }),
			  new OpenLayers.Control.ArgParser(),
			  new OpenLayers.Control.Navigation(),
			  new OpenLayers.Control.PanZoomBar(),
			  new OpenLayers.Control.LayerSwitcher(),
			  new OpenLayers.Control.Permalink(),
			  new OpenLayers.Control.MousePosition()
			    ]
		} );

		statkart = new OpenLayers.Layer.WMS(
		  "Statens Kartverk sjøkart2",
		  "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
		  {layers: "sjo_hovedkart2", format: 'image/png'},
		  {
		    attribution:'<a href="http://www.statkart.no">Statens kartverk</a>, <a href="http://www.statkart.no/nor/Land/Fagomrader/Geovekst/">Geovekst</a> og <a href="http://www.statkart.no/?module=Articles;action=Article.publicShow;ID=14194">kommuner</a>',
		    isBaseLayer: false,
		    visibility: false,
		    opacity: 0.5
		  }
		);

		var mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik");

		var strategy = new OpenLayers.Strategy.BBOX({resFactor:1.5});
		vector = new OpenLayers.Layer.Vector(
		  "OSM-vektorer",
		  {
		    isBaseLayer: false,
		    strategies: [strategy],
		    protocol: new OpenLayers.Protocol.HTTP({
		      url: "/osm/api/0.6/map",
		      format: new OpenLayers.Format.OSM({})
		    }),
		    projection: stdProj,
		    visibility: false
		  }
		);

		vector.events.register("refresh", null, function(e) {
					 alert("refresh: "+e);
				       });

		map.addLayers([mapnik, statkart, vector]);
		if (!map.getCenter()) {
		  map.zoomToMaxExtent();
		}
	      };

	      // Hekt koden fast i dokumentet
	      window.addEventListener("load", init, false);

	      // Offentlige variable
	      return {

	      };
	    })();
