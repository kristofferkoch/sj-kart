var STATUS = {};

(function() {
	var div;
	
	addOnLoad(function() {
		div = $("status");
		replaceChildNodes(div);
	});
	
	STATUS.add = function(text, timeout, htmlClass) {
		var cancelTimeout, def;
		if (!div) { return; }
		if (htmlClass) {
			htmlClass = " " + htmlClass;
		} else {
			htmlClass = "";
		}
		var msgDiv = DIV({'class': "statusMsg"+ htmlClass}, text);
		
		div.appendChild(msgDiv);
		
		var remove = function() {
			div.removeChild(msgDiv);
			def = undefined;
		};
		
		if (typeof timeout === 'number') {
			def = callLater(timeout, remove);
			cancelTimeout = function() {
				if (def) {
					def.cancel();
					def = undefined;
					return true;
				}
				return false;
			};
		} else {
			cancelTimeout = function() {};
		}
		
		return {
			'remove': remove,
			'cancelTimeout': cancelTimeout
		};
	};
	STATUS.handleDeferred = function(def, workingText, doneText, errorText, timeout) {
		var working = STATUS.add(workingText, null, "statusWorkingMsg");
		if (!timeout) {
			timeout = 5;
		}
		def.addCallback(function() {
			working.remove();
			if (doneText) {
				STATUS.add(doneText, timeout, "statusDoneMsg");
			}
		});
		def.addErrback(function(err) {
			working.remove();
			STATUS.add(errorText+": " + err , timeout, "statusErrorMsg");
		});
	};
	
})();
