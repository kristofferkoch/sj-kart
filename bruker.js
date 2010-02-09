"use strict";
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
/*global MochiKit: false, KART: false, STATUS: false */
var USER = {};

(function () {
	var loginDiv, userData,
		setFormEnabled, jsonCb, authCallback, menu;

	setFormEnabled = function (en) {
		var i, form;
		KART.setKeyboardControlEnabled(!en);
		form = loginDiv.getElementsByTagName("form")[0];
		for (i = 0; i < form.elements.length; i += 1) {
			form.elements[i].disabled = !en;
		}
	};
	USER.doLogin = function (form) {
		var username, password, d;
		username = form.elements[0].value;
		password = form.elements[1].value;
		if (username.length === 0 || password.length === 0) {
			STATUS.add("Oppgi brukernavn og passord.", 5);
			return;
		}
		setFormEnabled(false);
		d = MochiKit.Async.doXHR("auth.php", {
			method: "POST",
			sendContent: MochiKit.Base.queryString({'user': username, 'password': password}),
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		});

		d.addCallback(MochiKit.Base.partial(jsonCb, true));
		STATUS.handleDeferred(d, "Logger inn " + username + "...", null, "Intern feil ved innlogging");
		// TODO: handle errback
	};
	USER.cancelLogin = function (form) {
		loginDiv.style.display = "none";
		setFormEnabled(false);
	};


	jsonCb = function (err, r) {
		r = MochiKit.Async.evalJSONRequest(r);
		authCallback(r, err);
	};
	authCallback = function (result, err) {
		var n, f;
		if (result === "no") {
			loginDiv.style.display = "none";
			menu.showLoginLink();
		} else if (result.id && result.name) {
			STATUS.add("Logget inn som " + result.name + ".", 5);		
			loginDiv.style.display = "none";
			menu.showUser(result);
		} else if (result === "logout") {
			setFormEnabled(false);
			loginDiv.style.display = "none";
			menu.showLoginLink();
		} else {//if (result === "fail") {
			if (err) {
				setFormEnabled(true);
				STATUS.add("Feil brukernavn eller passord", 5);
				MochiKit.Visual.shake(loginDiv);
				f = loginDiv.getElementsByTagName("input")[1];
				f.select();
				f.focus();
			} else {
				loginDiv.style.display = "none";
				menu.showLoginLink();
			}
		}
	};
	
	menu = function () {
		var div = MochiKit.DOM.getElement("menu"),
			current = MochiKit.DOM.SPAN({'class': "loading"}, "Laster..."),
			showLogin, logout, loginLink;
		showLogin = function () {
			setFormEnabled(true);
			loginDiv.style.display = "block";
			loginDiv.getElementsByTagName("input")[0].focus();
			return false;
		};
		logout = function () {
			var d = MochiKit.Async.doXHR(
				"auth.php", {
					method: "POST",
					sendContent: MochiKit.Base.queryString({"logout": true}),
					headers: {"Content-Type": "application/x-www-form-urlencoded"}
				}
			);
			d.addCallback(MochiKit.Base.partial(jsonCb, false));
			STATUS.handleDeferred(d, "Logger ut...", "Logget ut", "Feil under utlogging");
			loginDiv.getElementsByTagName("input")[1].value = "";
			return false;
		};
		loginLink = MochiKit.DOM.A({href: "#login", onclick: showLogin}, "Logg inn");
		MochiKit.DOM.appendChildNodes(div, " ", current);
		
		return {
			showLoginLink: function () {
				div.removeChild(current);
				MochiKit.DOM.appendChildNodes(div, loginLink);
				current = loginLink;
			},
			showUser: function (user) {
				var n = MochiKit.DOM.SPAN(
					null,
					"Logget på som " + user.name + ". ",
					MochiKit.DOM.A({href: "#logout", onclick: logout}, "Logg ut.")
				);
				div.removeChild(current);
				MochiKit.DOM.appendChildNodes(div, n);
				current = n;
			}
		};
	}; /* initialized by on load */

	MochiKit.DOM.addLoadEvent(function () {
		var d;
		loginDiv = MochiKit.DOM.getElement("login");
		menu = menu();
		
		d = MochiKit.Async.loadJSONDoc("auth.php");
		d.addCallback(authCallback);
		STATUS.handleDeferred(d, "Sjekker innlogging...", null, "Feil under innloggingssjekk");
	});
}());

