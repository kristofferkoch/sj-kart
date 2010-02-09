SEARCH = {};

(function() {
	SEARCH.doSearch = function(form) {
		var str = form.elements[0].value;
		var d = loadJSONDoc("search.php?search="+escape(str));
		d.addCallback(function(result) {
			if (result.length === 0) {
				STATUS.add("Ingen resultat for '"+str+"'.", 5);
				return;
			}
			STATUS.add("Søk ikke ordentlig implementert enda", 6);
			map(function(r) {STATUS.add(r.name + " " + r.position, 5);}, result);
		});
		STATUS.handleDeferred(d, "Søker...", null, "Søk feilet");
		
	};

})();

