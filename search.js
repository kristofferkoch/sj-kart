"use strict";
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global STATUS: false, MochiKit: false, OpenLayers: false, KART: false */
var SEARCH = {};

(function () {
	var stdProj	= new OpenLayers.Projection("EPSG:4326");
	var resultDiv, div, closebutton, markers;
	SEARCH.close = function() {
		MochiKit.DOM.replaceChildNodes(resultDiv);
		div.style.display = "none";
		if (markers) {
			KART.map.removeLayer(markers);
			markers.destroy();
			markers = undefined;
		}
	};
	SEARCH.doSearch = function (form) {
		var str, d;
		str = form.elements[0].value;
		d = MochiKit.Async.loadJSONDoc("search.php?search=" + encodeURIComponent(str));
		d.addCallback(function (result) {
			var bounds, i, r, size, offset, icon, pos;
			
			if (result.length === 0) {
				STATUS.add("Ingen resultat for '" + str + "'.", 5);
				return;
			}
			
			SEARCH.close();
			
			size = new OpenLayers.Size(32, 32);
			offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

			//opprett et midlertidig vektorlag med søkeresultatene
			markers = new OpenLayers.Layer.Markers(
				"Søkeresultat for '" + str + "'",
				{markers: markers}
			);
			KART.map.addLayer(markers);
			
			//Finn maksimal bbox som alle punktene passer i
			bounds = new OpenLayers.Bounds();
			
			for(i = 0; i < result.length; i += 1) {
				r = result[i];
				icon = new OpenLayers.Icon('/icons2/openstreetmap/classic.big/sightseeing.png', size, offset);
				pos = new OpenLayers.LonLat(r.lon, r.lat);
				pos.transform(stdProj, KART.map.getProjectionObject());
				bounds.extend(pos);
				markers.addMarker(new OpenLayers.Marker(pos, icon));
				
				//vis liste med søkreresultetene i div
				resultDiv.appendChild(
					MochiKit.DOM.DIV(null, 
						MochiKit.DOM.A(
							{
								href: "#" + r.name,
								onclick: function (r, pos) {
									return function () {
										// TODO: pan to pos
										if (KART.map.getZoom() < 10) {
											KART.map.zoomTo(10);
										}
										KART.map.panTo(pos);
										return false;
									};
								}(r, pos)
							},
							MochiKit.DOM.IMG({src: icon.url}), r.name)
						)
				);
			}
			
			//zoom til denne bboxen
			KART.map.zoomToExtent(bounds);
			
			div.style.display = "block";
	
		});
		STATUS.handleDeferred(d, "Søker...", null, "Søk feilet");
		
	};
	MochiKit.DOM.addLoadEvent(function () {
		div = MochiKit.DOM.getElement("searchresults");
		resultDiv = MochiKit.DOM.DIV();
		div.appendChild(resultDiv);
	});

}());

