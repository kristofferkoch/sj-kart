"use strict";
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, OpenLayers: false, STATUS: false*/

var KART = {};

(function () {
	var	proj	= new OpenLayers.Projection("EPSG:900913"),
		stdProj	= new OpenLayers.Projection("EPSG:4326"),
		createMap, createStatkartLayer, createPolygonLayer,
		createVectorLayer, measureControl;
	/*
	 * createMap(opt): Returns a customized OpenLayers.Map
	 */
	createMap = function (opt) {
		var r, 
			keyboardControl = new OpenLayers.Control.KeyboardDefaults();
		r = new OpenLayers.Map('kart',
			{
				projection: proj,
				displayProjection: stdProj,
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
		KART.setKeyboardControlEnabled = function (enabled) {
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
			KART.boundingPoly = evt.feature.geometry;
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
		STATUS.handleDeferred(d, "Laster vektorkoder...", null, "Feil under lasting av vektorkoder");
		KART.getCode = function (code) {
			if (!dict) {
				return;
			}
			return dict[code];
		};
		return [r, select];
	};

	measureControl = function () {
		var measure, handleMeasure, checkbox, msg, sketchSymbolizers, style, styleMap;
		sketchSymbolizers = {
			"Point": {
				pointRadius: 4,
				graphicName: "square",
				fillColor: "white",
				fillOpacity: 1,
				strokeWidth: 1,
				strokeOpacity: 1,
				strokeColor: "#333333"
			},
			"Line": {
				strokeWidth: 3,
				strokeOpacity: 1,
				strokeColor: "#666666",
				strokeDashstyle: "dash"
			}
		};
		style = new OpenLayers.Style();
		style.addRules([
			new OpenLayers.Rule({symbolizer: sketchSymbolizers})
		]);
		styleMap = new OpenLayers.StyleMap({"default": style});


		measure = new OpenLayers.Control.Measure(
			OpenLayers.Handler.Path, {
				persist: true,
				handlerOptions: {
					layerOptions: {styleMap: styleMap}
				}
			}
		);
		handleMeasure = function (event) {
			var geometry = event.geometry,
				units = event.units,
				measure = event.measure,
				element = document.getElementById('measureout');
			if (event.type === "measure") {
				msg.remove();
				msg = STATUS.add("Målte opp " + measure.toFixed(3) + " " + units, 5);
			}
            element.innerHTML = ": " + measure.toFixed(3) + " " + units;
		};
		measure.events.register("measure", null, handleMeasure);
		measure.events.register("measurepartial", null, handleMeasure);
		
		KART.enableMeasure = function (input) {		
			if (input.checked) {
				msg = STATUS.add("Tegn linjer på kartet for å måle. Hold inne 'shift' for å tegne for frihånd, dobbelklikk for å avslutte.");
				measure.activate();
				checkbox = input;
			} else {
				if (msg) {
					msg.remove();
				}
				measure.deactivate();
				document.getElementById('measureout').innerHTML = "";
			}
		};
		return measure;
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
		
		map.addControl(measureControl());
		
		map.addControl(new OpenLayers.Control.Attribution());
		map.addControl(new OpenLayers.Control.Graticule({
			numPoints:	2,
			labelled:	true,
			visible:	false
		}));
		
		if (!map.getCenter()) {
			// Sør-Norge:
			map.setCenter(new OpenLayers.LonLat(1055440.0, 9387389.0), 5);
		}
		KART.map = map;
		KART.statkart = statkart;
		KART.mapnik = mapnik;

	});
}());

