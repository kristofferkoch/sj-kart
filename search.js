SEARCH = {};

(function() {
	SEARCH.doSearch = function(form) {
		var str = form.elements[0].value;
		var d = loadJSONDoc("search.php?search="+escape(str));
		d.addCallbacks(function(result) {
			alert(serializeJSON(result));
		}, function(error) {
			alert("error: "+error);
		});
		
	};

})();

