"use strict";
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global STATUS: false, MochiKit: false */
var SEARCH = {};

(function () {
	SEARCH.doSearch = function (form) {
		var str, d;
		str = form.elements[0].value;
		d = MochiKit.Async.loadJSONDoc("search.php?search=" + encodeURIComponent(str));
		d.addCallback(function (result) {
			if (result.length === 0) {
				STATUS.add("Ingen resultat for '" + str + "'.", 5);
				return;
			}
			STATUS.add("Søk ikke ordentlig implementert enda", 6);
			MochiKit.Base.map(function (r) {
					STATUS.add(r.name + " " + r.position, 5);
				},
				result
			);
		});
		STATUS.handleDeferred(d, "Søker...", null, "Søk feilet");
		
	};

}());

