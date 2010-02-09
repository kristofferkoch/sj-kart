"use strict";
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, KART: false, OpenLayers: false */

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

MochiKit.DOM.addLoadEvent(function () {
	var state, cookie_name = "kartstate",
		serialize, deserialize, onchange, map = KART.map;

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
		if (KART.autoswitcher) {
			KART.autoswitcher.setState(state.baselayerstate);
		}
	}
	
	// Get state from user-profile (TODO)
	// Add hooks to map to follow state
	onchange = function () {
		if (!state) {
			state = {};
		}
		state.center = map.getCenter();
		state.zoom = map.getZoom();
		state.baselayerstate = KART.autoswitcher ? KART.autoswitcher.getState() : "auto";

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
});
