var GLOB;

(function () {
	var	proj	= new OpenLayers.Projection("EPSG:900913"),
		stdProj	= new OpenLayers.Projection("EPSG:4326");

	var gjs = new OpenLayers.Format.GeoJSON()

	var MyWMS = OpenLayers.Class(OpenLayers.Layer.WMS, {
		getURL: function(bounds) {
			var r = OpenLayers.Layer.WMS.prototype.getURL.apply(this, arguments);
			return r;
		}
	});
	
	/*
	 * createMap(opt): Returns a customized OpenLayers.Map
	 */
	var createMap = function(opt) {
		var r;
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
	var createStatkartLayer = function(opt) {
		var r;
		r = new MyWMS(
				"Statens Kartverk sjøkart2",
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
	 * createOSMVectorLayer(opt): Returns a vector-layer
	 *   opt: object with maxResolution and maxExtent
	 *        properties
	 */
	var createOSMVectorLayer = function(opt) {
		var strategy = new OpenLayers.Strategy.BBOX({resFactor:1.5});
		var r;
		r = new OpenLayers.Layer.Vector(
				"OSM-vektorer",
				{
					isBaseLayer:	false,
					strategies:		[strategy],
					protocol:		new OpenLayers.Protocol.HTTP({
										url: "/osm/api/0.6/map",
										format: new OpenLayers.Format.OSM({})
									}),
					projection: stdProj,
					visibility: false//,
					//maxExtent: opt.maxExtent//,
					//maxResolution: opt.maxResolution
				}
			);
	    return r;
	};
	/*
	 * init(): Initializes map. Installed as an onload-handler in the document
	 */
	var init = function() {
		// OSM bildefliser
		var mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {transitionEffect: 'resize', isBaseLayer:true});

		var opt = {
					maxExtent: mapnik.maxExtent,
					maxResolution: mapnik.maxResolution
			};
		var map = createMap(opt);

		// OSM vektor-lag
		var vector = createOSMVectorLayer(opt);

		var statkart = createStatkartLayer(opt);


		// Tegne-støtte
		var polygonlayer = new OpenLayers.Layer.Vector(
				"Polygon Layer",
				{
					visibility:false,
				 	strategy: [new OpenLayers.Strategy.BBOX()],
				 	protocol: new OpenLayers.Protocol.HTTP({
						 	url: "polygon.js",
						 	format: new OpenLayers.Format.GeoJSON()
				 		}),
				 	projection:proj
				 }
			);
		var control = new OpenLayers.Control.DrawFeature(polygonlayer,
                                OpenLayers.Handler.Polygon);
		
		polygonlayer.events.register("visibilitychanged", map, function() {
			if (polygonlayer.visibility) {
				alert("Tegning aktivert");
				control.activate();
			} else {
				control.deactivate();
				var json = gjs.write(polygonlayer.features, true);
				alert(json);
				GLOB=json;		
			}
		});

		// Legg til lag
		map.addLayers([mapnik, statkart, polygonlayer]);

		map.addControl(control);

		map.addControl(new OpenLayers.Control.Attribution());
		map.addControl(new OpenLayers.Control.Graticule({
							numPoints:	2,
							labelled:	true,
							visible:	false
						}));

		
		(function() {
			var mode = "auto";
			var state = map.baseLayer;
			var zoom = map.getZoom();
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
				if (zoom >= 12) {
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
		})();
		
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

