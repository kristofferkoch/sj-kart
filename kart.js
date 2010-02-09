"use strict";
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, OpenLayers: false, STATUS: false*/

var getCookie = function (c_name) {
	var c_start, c_end;
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start !== -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end === -1) {
				c_end = document.cookie.length;
			}
			return decodeURIComponent(document.cookie.substring(c_start, c_end));
		}
	}
	return;
};

var kart = {};

(function () {
	var	proj	= new OpenLayers.Projection("EPSG:900913"),
		stdProj	= new OpenLayers.Projection("EPSG:4326"),
		createMap, createStatkartLayer, createPolygonLayer,
		createVectorLayer, autoSwitcher, stateKeeper;
	/*
	 * createMap(opt): Returns a customized OpenLayers.Map
	 */
	createMap = function (opt) {
		var r, 
			keyboardControl = new OpenLayers.Control.KeyboardDefaults();
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
					keyboardControl
				]
			}
		);
		kart.setKeyboardControlEnabled = function (enabled) {
			if (enabled) {
				if (!keyboardControl) {
					//alert("enabling keyboard");
					keyboardControl = new OpenLayers.Control.KeyboardDefaults();
					r.addControl(keyboardControl);
				}
			} else {
				if (keyboardControl) {
					//alert("disabling keyboard");
					r.removeControl(keyboardControl);
					keyboardControl.destroy();
					keyboardControl = undefined;
				}
			}
		};
		kart.showMessage = function (msg) {
			var pos = r.getCenter(),
				size = new OpenLayers.Size(200, 60),
				popup = new OpenLayers.Popup("melding",
								pos, size,	msg,
								true
							);
			popup.closeOnMove = true;
			r.addPopup(popup);
		};
		//r.addControl(new OpenLayers.Control.LoadingPanel());
		return r;
	};

	/*
	 * createStatkartLayer(opt): Returns a sjøkart-layer
	 *   opt: object with maxResolution property
	 */
	createStatkartLayer = function (osm, opt) {
		var r,
		// Create filtering WMS-class
			MyWMS = OpenLayers.Class(OpenLayers.Layer.WMS, {
			getURL: function (bounds) {
				var r;
				if ((!this.boundingPoly) || this.boundingPoly.intersects(bounds.toGeometry())) {
					r = OpenLayers.Layer.WMS.prototype.getURL.apply(this, arguments);
				} else {
					//r = "hav.png";
					r = osm.getURL(bounds);
				}
				return r;
			},
			boundingPoly: undefined,
			setBoundingPoly: function (poly) {
				this.boundingPoly = poly;
			},
			getBoundingPoly: function () {
				return this.boundingPoly;
			}
		});
		r = new MyWMS(
			"Statens Kartverk",
			"http://opencache.statkart.no/gatekeeper/gk/gk.open?",
			{layers: "sjo_hovedkart2"},
			{
				attribution:	'Sjøkart fra <a href="http://www.statkart.no">Statens kartverk</a>, ' +
								'<a href="http://www.statkart.no/nor/Land/Fagomrader/Geovekst/">Geovekst</a> og ' +
								'<a href="http://www.statkart.no/?module=Articles;action=Article.publicShow;ID=14194">kommuner</a>',
				isBaseLayer: true,
				buffer: 0, // 2
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
	 * createPolygonLayer(map): Load a polygon corresponding to the statkart sjøkart coverage
	 */
	createPolygonLayer = function (statkart) {
		var r, msg, featureadded;
		r = new OpenLayers.Layer.Vector(
			"Kyst-polygon",
			{
				visibility: false,
				strategies: [new OpenLayers.Strategy.Fixed({preload: true})],
				protocol: new OpenLayers.Protocol.HTTP({
					url: "polygon.js",
					format: new OpenLayers.Format.GeoJSON()
				}),
				projection: proj,
				displayInLayerSwitcher: true
			}
		);
		msg = STATUS.add("Laster vektor-område...");
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
		featureadded = function (evt) {
			// Set global variable when polygon is loaded
			/* "boundingPoly" is "global" variable, used by functions in the createStatkart scope */
			statkart.setBoundingPoly(evt.feature.geometry);
			r.events.unregister("featureadded", r, featureadded);
			msg.remove();
		};
		r.events.register("featureadded", r, featureadded);
		return r;
	};

	createVectorLayer = function () {
		var r, strategy, fmt, prefix, icons, dict, options, select, d;

		strategy = new OpenLayers.Strategy.BBOX({
			resFactor: 2
		});
		fmt = new OpenLayers.Format.GeoJSON();
		r = new OpenLayers.Layer.Vector(
			"Informasjon",
			{
				strategies: [strategy],
				protocol: new OpenLayers.Protocol.HTTP({
					url: "geo.php",
					format: fmt
				}),
				projection: stdProj
			}
		);
		prefix = "/icons2/openstreetmap/classic.big/";
		icons = {
			'T.ISL': "places/island.png"
		};
		r.events.register("beforefeatureadded", null, function (ev) {
			var a, e, def;
			a = ev.feature.attributes;
			e = OpenLayers.Util.extend;
			def = {cursor: "pointer"};
			
			if (a.type === "P.PPL" || a.type === "S.FRMS") {
				def.label = a.name;
				def.fontSize = "0.4em";
			}
			if (icons[a.type] !== undefined) {
				def.externalGraphic = prefix + icons[a.type];
				def.graphicWidth = 20;
				def.graphicHeight = 20;
				def.graphicOpacity = 1;
			}
			
			ev.feature.style = e(def, OpenLayers.Feature.Vector.style['default']);
		
			return true;
		});
		dict = undefined;
		options = {
			hover: false,
			onSelect: function (feature) {
				var d, t;
				d = MochiKit.DOM.getElement("featureinfo");
				t = feature.data.type;
				d.innerHTML = dict[t] + " (" + t + "): " + feature.data.name + " (" + feature.data.population + ") " + feature.data.elevation;
				d.style.display = "block";
			}
		};
		select = new OpenLayers.Control.SelectFeature(r, options);
		d = MochiKit.Async.loadJSONDoc("featurecodes.js");
		d.addCallback(function (result) {
			dict = result;
		});
		STATUS.handleDeferred(d, "Laster vektorkoder...", "Lastet vektorkoder", "Feil under lasting av vektorkoder");
		return [r, select];
	};

	/*
	 * autoSwitcher: Switches between layers corresponding to where the user is looking, and at what zoomlevel.
	 *               Statkart is not very good at zoomlevels smaller than 12, and have limited coverage
	 *               Respects if the user overrides the layer-setting in the layer-chooser
	 *           Returns: object with setState and getState, returning "auto" if the user have not overridden,
	 *                    "osm" if osm-layer is forced, and "statkart" if statkart is forced.
	 */
	autoSwitcher = function (map, mapnik, statkart) {
		var mode = "auto",
			state = map.baseLayer,
			zoom = map.getZoom(),
			isStatkartArea, changelayer, zoomend;
		isStatkartArea = function () {
			var bounds, poly = statkart.getBoundingPoly();
			if (!poly) {
				return true;
			}
			bounds = map.calculateBounds().toGeometry();
			return poly.intersects(bounds);
		};
		changelayer = function (evt) {
			var layer = evt.layer,
				prop = evt.property;

			if (prop === "visibility") {
				if (layer === mapnik && !mapnik.visibility) {
					// Mapnik is being turned off
					if (zoom >= 12 && isStatkartArea()) {
						//alert("setting auto (statkart) mode");
						mode = "auto";
					} else {
						//alert("setting forced statkart mode");
						mode = statkart;
					}
				} else if (layer === statkart && !statkart.visibility) {
					// Statkart is being turned off
					if (zoom >= 12 && isStatkartArea()) {
						//alert("setting forced mapnik mode");
						mode = mapnik;
					} else {
						//alert("setting auto (mapnik) mode");
						mode = "auto";
					}
				}
			}
		};
		zoomend = function () {
			zoom = map.getZoom();
			if (mode !== "auto") {
				return;
			}
			if (zoom >= 12 && isStatkartArea()) {
				state = statkart;
			} else {
				state = mapnik;
			}
			if (map.baseLayer !== state) {
				//alert("autosetting to "+state.name);
				map.setBaseLayer(state);
			}
		};
		map.events.register("changelayer", map, changelayer);
		map.events.register("zoomend", map, zoomend);
		map.events.register("moveend", map, zoomend);
		return {getState: function () {
					if (mode === "auto") {
						return "auto";
					} else if (mode === mapnik) {
						return "osm";
					} else if (mode === statkart) {
						return "statkart";
					}
				},
				setState: function (setTo) {
					if (setTo === "osm") {
						mode = mapnik;
					} else if (setTo === "statkart") {
						mode = statkart;
					} else {
						mode = "auto";
					}
					if (state === "auto") {
						zoomend();
						return;
					}
					state = mode;
					if (map.baseLayer !== state) {
						map.setBaseLayer(state);
					}
				}
			};
	};
	stateKeeper = function (map, switcher) {
		var state, cookie_name = "kartstate",
			serialize, deserialize, onchange;

		// Serialized format: lon,lat,zoom,baselayerstate
		
		// Serializing function for state
		serialize = function (state) {
			var lat = state.center.lat,
				lon = state.center.lon;
			return lon + "," + lat + "," + state.zoom + "," + state.baselayerstate;
		};
		// Deserializing function for state
		deserialize = function (text) {
			var splt;
			if (!text || !text.split) {
				return;
			}
			splt = text.split(",");
			if (splt.length !== 4) {
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
		onchange = function () {
			if (!state) {
				state = {};
			}
			state.center = map.getCenter();
			state.zoom = map.getZoom();
			state.baselayerstate = switcher.getState();

			if (state.center) {
				var str = serialize(state);
				location.replace("#" + str);
				document.cookie = cookie_name + "=" + encodeURIComponent(str);
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
	MochiKit.DOM.addLoadEvent(function () {
		var mapnik, opt, map, statkart, polygonlayer, vectorselect, switcher;
		OpenLayers.Lang.setCode('nb');

		// OSM bildefliser
		mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {
			transitionEffect: 'resize',
			isBaseLayer: true
		});

		opt = {
			maxExtent: mapnik.maxExtent,
			maxResolution: mapnik.maxResolution
		};
		map = createMap(opt);
		statkart = createStatkartLayer(mapnik, opt);

		// Tegne-støtte
		polygonlayer = createPolygonLayer(statkart);
		
		vectorselect = createVectorLayer();
		// Legg til lag
		map.addLayers([mapnik, statkart, vectorselect[0], polygonlayer]);

		map.addControl(vectorselect[1]);
		vectorselect[1].activate();

		switcher = autoSwitcher(map, mapnik, statkart);

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

	});
}());

