(function(){
	var menuDiv, loginSpan, menu, user;

	menu = SPAN(null, " ", A({href: "#legg_til"}, "Legg til..."));

	var jsonCb = function(err, r) {
		r = evalJSONRequest(r);
		authCallback(r, err);
	};
	var doLogin = function(username, password) {
		var d = doXHR("auth.php", {
					method: "POST",
					sendContent:queryString({'user': username, 'password': password}),
					headers:{"Content-Type": "application/x-www-form-urlencoded"}
				});
		d.addCallbacks(partial(jsonCb, true), showLoginForm);
	};
	
	var doLogout = function() {
		var d = doXHR("auth.php", {
					method: "POST",
					sendContent: queryString({"logout": true}),
					headers:{"Content-Type": "application/x-www-form-urlencoded"}
				});
		user = undefined;
		clearLoginForm();
		d.addCallbacks(partial(jsonCb, false), showLoginForm);
		return false;
	};
	
	var showLoginForm, clearLoginForm;
	(function() {
		var loggingIn = SPAN(null, "Logger inn...");
		
		var formSubmitted = function() {
			kart.setKeyboardControlEnabled(true);
			swapDOM(loginSpan, loggingIn);
			loginSpan = loggingIn;
			doLogin(usernameInput.value, passwordInput.value);
			return false;
		};
		var usernameInput = INPUT({type:"text"},""),
			passwordInput = INPUT({type:"password"}, ""),
			form = FORM({onsubmit:formSubmitted},
					usernameInput, passwordInput,
					INPUT({type:"submit", value:"Logg inn"}),
					INPUT({type:"reset", value:"Avbryt", 
							onclick: function() {
									kart.setKeyboardControlEnabled(true);
									showLoginLink();
									return true;
								}
						})
				);

		showLoginForm = function() {
			// turn off map keyboard-navigation
			kart.setKeyboardControlEnabled(false);
			swapDOM(loginSpan, form);
			loginSpan = form;
			usernameInput.focus();
			return false;
		};
		clearLoginForm = function() {
			form.reset();
		}
	})();
	
	var showLogoutForm = function() {
		var n = SPAN(null, "Hei, "+user.name+"! ",
					A({href:"#logout", onclick:doLogout}, "Ikke deg?")
					);
		swapDOM(loginSpan, n);
		loginSpan = n;
	};
	
	var showLoginLink = function() {
		var n = SPAN(null, A({href:"#login", onclick:partial(showLoginForm, "")},
								"Logg inn."), " ",
							A({href:"xxx"}, "Register bruker")
					);
		swapDOM(loginSpan, n);
		loginSpan = n;
	};

	var authCallback = function(result, err) {
		var n;
		if (result === "no") {
			user = undefined;
			showLoginLink();
		} else if (result.id && result.name) {
			user = result;
			showLogoutForm();
		} else {//if (result === "fail") {
			user = undefined;
			if (err) {
				kart.showMessage("Feil brukernavn eller passord");
				showLoginForm();
			} else {
				showLoginLink();
			}
		}
	};
	
	var init = function() {
		var d;
		menuDiv = document.getElementById("menu");

		loginSpan = SPAN("Sjekker innlogging...");
		menuDiv.removeChild(menuDiv.childNodes[0]);
		menuDiv.appendChild(loginSpan);
		menuDiv.appendChild(menu);
		
		d = loadJSONDoc("auth.php");
		d.addCallbacks(authCallback, partial(alert, "fail"));
	};
	addOnLoad(init);
})();
