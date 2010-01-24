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
		    //restrictedExtent: new OpenLayers.Bounds(0, 7748580, /* 424375.89459, 7870878.35909,*/ 3653075.96878, 11618127.23308),
		    units: "m",
		    //maxResolution: 360 ,//156543.0339,
		    controls: [
			       new OpenLayers.Control.Navigation({documentDrag: true}),
			       new OpenLayers.Control.PanZoom(),
			       new OpenLayers.Control.LayerSwitcher(),
			       new OpenLayers.Control.MousePosition(),
			       new OpenLayers.Control.NavToolbar(),
			       new OpenLayers.Control.ScaleLine(),
			       new OpenLayers.Control.Scale()
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
	var cookieSaver = function() {
	  var getCookie = function (c_name) {
	    if (document.cookie.length>0) {
	      c_start=document.cookie.indexOf(c_name + "=");
	      if (c_start !== -1) {
		c_start = c_start + c_name.length+1;
		c_end = document.cookie.indexOf(";",c_start);
		if (c_end === -1) {
		  c_end = document.cookie.length;
		}
		return unescape(document.cookie.substring(c_start,c_end));
	      }
	    }
	    return "";
	  };
	  var moveend = function() {
	    var c = map.getCenter();
	    var z = map.getZoom();
	    var str = c.lon+","+c.lat+","+z;
	    document.cookie = "view="+str;
	    location.hash = str;
	  };
	  map.events.register("moveend", map, moveend);
	  map.events.register("zoomend", map, moveend);
	  var str, lon, lat, zoom;
	  if (location.hash && location.hash.length > 6) {
	    str = location.hash.substring(1);
	    //alert("hash: "+str)
	  } else {
	    str = getCookie("view");
	  }
	  if (str && str.length > 5 && !map.getCenter()) {
	    str = str.split(",",3);
	    lon = str[0];
	    lat = str[1];
	    zoom = str[2];
	    //alert(lon+", "+lat+", "+zoom);
	    map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
	  }
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
			    numPoints: 2,
			    labelled: true,
			    visible: false
			    })
		);
	    addAutoVisibility(function() {
		    return map.getZoom() >= 11;
		}, statkart);
	    cookieSaver();
	    if (!map.getCenter()) {
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
