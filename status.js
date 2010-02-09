"use strict";
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false */
var STATUS = {};

(function () {
	var div;

	STATUS.add = function (text, timeout, htmlClass) {
		var cancelTimeout, def, msgDiv, remove;
		if (!div) {
			return;
		}
		if (htmlClass) {
			htmlClass = " " + htmlClass;
		} else {
			htmlClass = "";
		}
		msgDiv = MochiKit.DOM.DIV({'class': "statusMsg" + htmlClass}, text);
		
		div.appendChild(msgDiv);
		
		remove = function () {
			MochiKit.Visual.blindUp(msgDiv, {
				afterFinish: function () {
					div.removeChild(msgDiv);
				}
			});
			def = undefined;
		};
		
		if (typeof timeout === 'number') {
			def = MochiKit.Async.callLater(timeout, remove);
			cancelTimeout = function () {
				if (def) {
					def.cancel();
					def = undefined;
					return true;
				}
				return false;
			};
		} else {
			cancelTimeout = function () {};
		}
		
		return {
			'remove': remove,
			'cancelTimeout': cancelTimeout
		};
	};
	STATUS.handleDeferred = function (def, workingText, doneText, errorText, timeout) {
		var working = STATUS.add(workingText, null, "statusWorkingMsg");
		if (!timeout) {
			timeout = 5;
		}
		def.addCallback(function () {
			working.remove();
			if (doneText) {
				STATUS.add(doneText, timeout, "statusDoneMsg");
			}
		});
		def.addErrback(function (err) {
			working.remove();
			STATUS.add(errorText + ": " + err, timeout, "statusErrorMsg");
		});
	};
		
	MochiKit.DOM.addLoadEvent(function () {
		div = MochiKit.DOM.getElement("status");
		MochiKit.DOM.replaceChildNodes(div);
	});
}());

