var kart = (function () {
	var statProj = new OpenLayers.Projection("EPSG:32633"),
	stdProj = new OpenLayers.Projection("EPSG:4326");
	// Private variabler
	var map, // OpenLayers.Map kart
	statkart, // WMS-lag med sjøkartfliser fra statkart
	vector; // Vektor-lag med "aktiv" informasjon
	
	// Private funksjoner
	var createMap = function() {
	    return new OpenLayers.Map('kart', {
		    projection: new OpenLayers.Projection("EPSG:900913"),
		    displayProjection: stdProj,
		    maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
		    restrictedExtent: new OpenLayers.Bounds(424375.89459, 7870878.35909, 3653075.96878, 11618127.23308),
		    units: "m",
		    maxResolution: 156543.0339,
		    //numZoomLevels: 10,
		    controls: [
			       new OpenLayers.Control.ArgParser(),
			       new OpenLayers.Control.Navigation(),
			       new OpenLayers.Control.PanZoomBar(),
			       new OpenLayers.Control.LayerSwitcher(),
			       new OpenLayers.Control.Permalink(),
			       new OpenLayers.Control.MousePosition()
			       ]
		} );
	};
	var createStatkartLayer = function() {
	    return new OpenLayers.Layer.WMS("Statens Kartverk sjøkart2",
					    "http://opencache.statkart.no/gatekeeper/gk/gk.open?",
	                                    {layers: "sjo_hovedkart2", format: 'image/png'},
	                                    {attribution:'Sjøkart fra <a href="http://www.statkart.no">Statens kartverk</a>, '+
					     '<a href="http://www.statkart.no/nor/Land/Fagomrader/Geovekst/">Geovekst</a> og '+
					     '<a href="http://www.statkart.no/?module=Articles;action=Article.publicShow;ID=14194">kommuner</a>',
					     isBaseLayer: false,
					     transitionEffect: 'resize',
					     visibility: false//,
					     //opacity: 0.5
					    }
					   );
	};
	var createOSMVectorLayer = function() {
	    var strategy = new OpenLayers.Strategy.BBOX({resFactor:1.5});
	    var ret = new OpenLayers.Layer.Vector("OSM-vektorer",
	                                          {isBaseLayer: false,
						   strategies: [strategy],
						   protocol: new OpenLayers.Protocol.HTTP({
							   url: "/osm/api/0.6/map",
							   format: new OpenLayers.Format.OSM({})
						       }),
						   projection: stdProj,
						   visibility: false
						  }
						  );
	    return ret;
	};
	var addAutoVisibility = function(rule, layer) {
	    var force = "no";
	    var zoomend = function() {
		if (rule()) {
		    if (force !== "off") {
			layer.setVisibility(true);
		    }
		} else {
		    if (force !== "on") {
			layer.setVisibility(false);
		    }
		}
	    };
	    map.events.register("zoomend", map, zoomend);
	    var changelayer = function(evt) {
		    var s;
		    if (evt.layer === layer && evt.property === "visibility") {
			s = rule();
			if (s !== layer.getVisibility()) {
			    // Visibility is forced
			    if (s) {
				//msg("force off")
				force = "off";
			    } else {
				//msg("force on");
				force = "on";
			    }
			} else {
			    force = "no";
			}
		    }
		}
	    map.events.register("changelayer", map, changelayer);
	};
	var init = function() {
	    map = createMap();
	    
	    statkart = createStatkartLayer();
	    
	    // OSM bildefliser
	    var mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {transitionEffect: 'resize'});
	    
	    // OSM vektor-lag
	    vector = createOSMVectorLayer();

	    map.addLayers([mapnik, statkart, vector]);
	    map.addControl(new OpenLayers.Control.Attribution());
	    map.addControl(new OpenLayers.Control.Graticule({
			numPoints:2,
			    labelled:true,
			    visible:false
			    })
		);
	    addAutoVisibility(function() {
		    return map.getZoom() >= 11;
		}, statkart);
	    if (!map.getCenter()) {
		//map.zoomToMaxExtent();
		//http://koch32.info.tm/kart/?zoom=5&lat=9387389.0934&lon=1055440.09772&layers=TBFF
		//TODO: finn område fra ip eller brukerprofil
		map.setCenter(new OpenLayers.LonLat(1055440.0, 9387389.0), 5);
	    }
	    
	};

	// Hekt koden fast i dokumentet
	if (window.addEventListener) {
	    window.addEventListener("load", init, false);
	} else {
	    // For internet explorer
	    window.attachEvent("onload", init);
	}
	
	// Offentlige variable
	return {
	    
	};
    })();
