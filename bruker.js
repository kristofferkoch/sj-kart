var user = {};
(function(){
	var loginDiv, userData;

	var setFormEnabled = function(en) {
		kart.setKeyboardControlEnabled(!en);
		var form = loginDiv.getElementsByTagName("form")[0];
		for(var i=0; i < form.elements.length; i++) {
			form.elements[i].disabled = !en;
		}
	};
	var jsonCb = function(err, r) {
		r = evalJSONRequest(r);
		authCallback(r, err);
	};
	user.doLogin = function(form) {
		var username, password;
		username = form.elements[0].value;
		password = form.elements[1].value;
		if (username.length === 0 || password.length === 0) {
			STATUS.add("Oppgi brukernavn og passord.", 5);
			return;
		}
		setFormEnabled(false);
		var d = doXHR("auth.php", {
					method: "POST",
					sendContent:queryString({'user': username, 'password': password}),
					headers:{"Content-Type": "application/x-www-form-urlencoded"}
				});

		d.addCallback(partial(jsonCb, true));
		STATUS.handleDeferred(d, "Logger inn " + username + "...", null, "Intern feil ved innlogging");
		// TODO: handle errback
	};
	user.cancelLogin = function(form) {
		loginDiv.style.display = "none";
		setFormEnabled(false);
	};


	var authCallback = function(result, err) {
		var n;
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
				shake(loginDiv);
				var f = loginDiv.getElementsByTagName("input")[1];
				f.select();
				f.focus();
			} else {
				loginDiv.style.display = "none";
				menu.showLoginLink();
			}
		}
	};
	
	var menu = (function() {
		var div = $("menu");
		var current = SPAN({'class':"loading"}, "Laster...");
		var showLogin = function() {
			setFormEnabled(true);
			loginDiv.style.display="block";
			loginDiv.getElementsByTagName("input")[0].focus();
			return false;
		};
		var logout = function () {
			var d = doXHR("auth.php", {
						method: "POST",
						sendContent: queryString({"logout": true}),
						headers:{"Content-Type": "application/x-www-form-urlencoded"}
					});
			d.addCallback(partial(jsonCb, false));
			STATUS.handleDeferred(d, "Logger ut...", "Logget ut", "Feil under utlogging");
			loginDiv.getElementsByTagName("input")[1].value = "";
			return false;
		};
		var loginLink = A({href:"#login", onclick:showLogin}, "Logg inn");
		appendChildNodes(div, " ", current);
		return {
			showLoginLink: function() {
				div.removeChild(current);
				appendChildNodes(div, loginLink);
				current = loginLink;
			},
			showUser: function(user) {
				var n = SPAN(null, "Logget på som "+user.name+". ",
							A({href:"#logout", onclick: logout}, "Logg ut.")
						);
				div.removeChild(current);
				appendChildNodes(div, n);
				current = n;
			}
		};
	}); /* initialized by init() */

	var init = function() {
		var d;
		loginDiv = $("login");
		menu = menu();
		
		d = loadJSONDoc("auth.php");
		d.addCallback(authCallback);
		STATUS.handleDeferred(d, "Sjekker innlogging...", null, "Feil under innloggingssjekk");
	};
	addOnLoad(init);
})();
