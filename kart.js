var GLOB;
function getCookie(c_name) {
	if (document.cookie.length>0) {
		c_start=document.cookie.indexOf(c_name + "=");
		if (c_start !== -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";",c_start);
			if (c_end === -1) {
				c_end=document.cookie.length;
			}
			return unescape(document.cookie.substring(c_start,c_end));
		}
	}
	return;
}

(function () {
	var	proj	= new OpenLayers.Projection("EPSG:900913"),
		stdProj	= new OpenLayers.Projection("EPSG:4326"),
		boundingPoly;

	/*
	 * createMap(opt): Returns a customized OpenLayers.Map
	 */
	var createMap = function(opt) {
		var r;
		r = new OpenLayers.Map('kart',
			{
				projection: proj,
				displayProjection: proj,//stdProj,
				units: "m",
				maxResolution: opt.maxResolution,
				maxExtent: opt.maxExtent,
				controls: [
					new OpenLayers.Control.Navigation(),
					new OpenLayers.Control.PanZoom(),
					new OpenLayers.Control.LayerSwitcher(),
					new OpenLayers.Control.MousePosition(),
					new OpenLayers.Control.NavToolbar(),
					new OpenLayers.Control.ScaleLine(),
					new OpenLayers.Control.Scale(),
					new OpenLayers.Control.KeyboardDefaults()
				]
			}
		);
		//r.addControl(new OpenLayers.Control.LoadingPanel());
		return r;
	};

	/*
	 * createStatkartLayer(opt): Returns a sjøkart-layer
	 *   opt: object with maxResolution property
	 */
	var createStatkartLayer = function(osm, opt) {
		var r;
		// Create filtering WMS-class
		var MyWMS = OpenLayers.Class(OpenLayers.Layer.WMS, {
			getURL: function(bounds) {
				var r;
				if ((!boundingPoly) || boundingPoly.intersects(bounds.toGeometry())) {
					r = OpenLayers.Layer.WMS.prototype.getURL.apply(this, arguments);
				} else {
					//r = "hav.png";
					r = osm.getURL(bounds);
				}
				return r;
			}
		});
		r = new MyWMS(
				"Statens Kartverk",
				"http://opencache.statkart.no/gatekeeper/gk/gk.open?",
				{layers: "sjo_hovedkart2"},
				{
					attribution:	'Sjøkart fra <a href="http://www.statkart.no">Statens kartverk</a>, '+
									'<a href="http://www.statkart.no/nor/Land/Fagomrader/Geovekst/">Geovekst</a> og '+
									'<a href="http://www.statkart.no/?module=Articles;action=Article.publicShow;ID=14194">kommuner</a>',
					isBaseLayer: true,
					transitionEffect: 'resize',
					maxResolution: opt.maxResolution,
					projection: proj,
					visibility: false//,
					//opacity: 0.5
				}
			);
		return r;
	};
	/*
	 * createPolygonLayer
	 */
	var createPolygonLayer = function(map) {
		var r;
		r = new OpenLayers.Layer.Vector(
				"Kyst-polygon",
				{
					visibility:false,
				 	strategies: [new OpenLayers.Strategy.Fixed({preload:true})],
				 	protocol: new OpenLayers.Protocol.HTTP({
						 	url: "polygon.js",
						 	format: new OpenLayers.Format.GeoJSON()
				 		}),
				 	projection:proj,
				 	displayInLayerSwitcher:true
				 }
			);
		/*var control = new OpenLayers.Control.DrawFeature(r,
                                OpenLayers.Handler.Polygon);
		map.addControl(control);
		
		r.events.register("visibilitychanged", r, function() {
			if (r.visibility) {
				alert("Tegning aktivert");
				control.activate();
			} else {
				var f = new OpenLayers.Format.GeoJSON();
				GLOB = f.write(r.features);
				log(GLOB);
				control.deactivate();
			}
		});
		*/
		var featureadded;
		featureadded = function(evt) {
			/* "boundingPoly" is "global" variable, used by functions in the createStatkart scope */
			boundingPoly = evt.feature.geometry;
			r.events.unregister("featureadded", r, featureadded);
		};
		r.events.register("featureadded", r, featureadded);
		return r;
	};
	var autoSwitcher = function(map, mapnik, statkart) {
		var mode = "auto";
		var state = map.baseLayer;
		var zoom = map.getZoom();
		var isStatkartArea = function() {
			if (!boundingPoly) {
				return true;
			}
			var bounds = map.calculateBounds().toGeometry();
			return boundingPoly.intersects(bounds);
		};
		var changelayer = function(evt) {
			var layer = evt.layer, prop = evt.property;
			if (zoom !== map.getZoom()) {
				alert("zoom !=");
			}
			if (prop === "visibility") {
				if (layer === mapnik && !mapnik.visibility) {
					// Mapnik is being turned off
					if (zoom >= 12) {
						//alert("setting auto (statkart) mode");
						mode = "auto";
					} else {
						//alert("setting forced statkart mode");
						mode = statkart;
					}
				} else if (layer === statkart && !statkart.visibility) {
					// Statkart is being turned off
					if (zoom >= 12) {
						//alert("setting forced mapnik mode");
						mode = mapnik;
					} else {
						//alert("setting auto (mapnik) mode");
						mode = "auto";
					}
				}
			}
		};
		var zoomend = function() {
			zoom = map.getZoom();
			if (mode !== "auto") {
				return;
			}
			if (zoom >= 12 && isStatkartArea()) {
				state = statkart;
			} else {
				state = mapnik;
			}
			if (map.baseLayer != state) {
				//alert("autosetting to "+state.name);
				map.setBaseLayer(state);
			}
		};
		map.events.register("changelayer", map, changelayer);
		map.events.register("zoomend", map, zoomend);
		map.events.register("moveend", map, zoomend);
		return {getState: function() {
					if (mode === "auto") {
						return "auto";
					} else if (mode === mapnik) {
						return "osm";
					} else if (mode === statkart) {
						return "statkart";
					}
				},
				setState: function(setTo) {
					if (setTo === "osm") {
						mode = mapnik;
					} else if (setTo === "statkart") {
						mode = statkart;
					} else {
						mode = "auto";
					}
				}
			};
	};
	var stateKeeper = function(map, switcher) {
		var cookie_name = "kartstate";
		var state;

		// Serialized format: lon,lat,zoom,baselayerstate
		
		// Serializing function for state
		var serialize = function(state) {
			var lat = state.center.lat;
			var lon = state.center.lon;
			return lon + "," + lat + "," + state.zoom + "," + state.baselayerstate;
		};
		// Deserializing function for state
		var deserialize = function(text) {
			var splt;
			if (!text || !text.split) {
				return;
			}
			splt = text.split(",");
			if (splt.length != 4) {
				return;
			}
			return {center: new OpenLayers.LonLat(splt[0], splt[1]),
					zoom: splt[2],
					baselayerstate: splt[3]
				};
		};
		
		// Get state from URL
		state = deserialize(location.hash.substring(1));
		
		// Get state from cookies
		if (!state) {
			state = deserialize(getCookie(cookie_name));
		}

		// Enforce saved state
		if (state) {
			map.setCenter(state.center, state.zoom, false, false);
			switcher.setState(state.baselayerstate);
		}
		
		// Get state from user-profile (TODO)
		// Add hooks to map to follow state
		var onchange = function() {
			if (!state) {
				state = {};
			}
			state.center = map.getCenter();
			state.zoom = map.getZoom();
			state.baselayerstate = switcher.getState();

			if (state.center) {
				location.hash = "#" + serialize(state);
			}
		};
		
		map.events.register("moveend", map, onchange);
		map.events.register("zoomend", map, onchange);
		map.events.register("changebaselayer", map, onchange);
		onchange();

		// Add hooks to follow location.hash
		// TODO: use map.panTo
	};
	
	/*
	 * init(): Initializes map. Installed as an onload-handler in the document
	 */
	var init = function() {
		OpenLayers.Lang.setCode('nb');

		// OSM bildefliser
		var mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {transitionEffect: 'resize', isBaseLayer:true});

		var opt = {	maxExtent: mapnik.maxExtent,
					maxResolution: mapnik.maxResolution};
		var map = createMap(opt);
		var statkart = createStatkartLayer(mapnik, opt);

		// Tegne-støtte
		var polygonlayer = createPolygonLayer(map);

		// Legg til lag
		map.addLayers([mapnik, statkart, polygonlayer]);

		var switcher = autoSwitcher(map, mapnik, statkart);
		
		map.addControl(new OpenLayers.Control.Attribution());
		map.addControl(new OpenLayers.Control.Graticule({
							numPoints:	2,
							labelled:	true,
							visible:	false
						}));

		stateKeeper(map, switcher);

		if (!map.getCenter()) {
			// Sør-Norge:
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
})();

