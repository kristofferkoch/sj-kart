"use strict";
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, KART: false, OpenLayers: false, STATUS: false */

MochiKit.DOM.addLoadEvent(function () {
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
	KART.map.addControl(measure);
});
	
