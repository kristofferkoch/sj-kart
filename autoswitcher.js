"use strict";
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, KART: false, STATUS: false */

/*
 * autoSwitcher: Switches between layers corresponding to where the user is looking, and at what zoomlevel.
 *               Statkart is not very good at zoomlevels smaller than 12, and have limited coverage
 *               Respects if the user overrides the layer-setting in the layer-chooser
 *           Returns: object with setState and getState, returning "auto" if the user have not overridden,
 *                    "osm" if osm-layer is forced, and "statkart" if statkart is forced.
 */
MochiKit.DOM.addLoadEvent(function () {
	var mode = "auto",
		state, zoom,
		isStatkartArea, changelayer, zoomend, map, statkart, mapnik;
	map = KART.map;
	statkart = KART.statkart;
	mapnik = KART.mapnik;
	state = map.baseLayer;
	zoom = map.getZoom();
	
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
			STATUS.add("Skifter kartlag for best visning.", 2);
			map.setBaseLayer(state);
		}
	};
	map.events.register("changelayer", map, changelayer);
	map.events.register("zoomend", map, zoomend);
	map.events.register("moveend", map, zoomend);
	
	KART.autoswitcher = {
		getState: function () {
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
});

