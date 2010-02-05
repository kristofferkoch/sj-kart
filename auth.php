<?php
header('Content-type: application/javascript');

chdir("/usr/share/mediawiki/");
require_once("/usr/share/mediawiki/includes/WebStart.php");
require_once("/usr/share/mediawiki/includes/Exception.php");
require_once("/usr/share/mediawiki/includes/User.php");

session_start();

function userData($user) {
	echo json_encode(array(
			'id'	=> $user->getId(),
			'name'	=> $user->getName()
		));

}

/* User logging in with POST? */
if (isset($_POST["user"]) && isset($_POST["password"])) {
	$user = User::newFromName($_POST["user"]);
	if ($user && $user->checkPassword($_POST["password"]) && $user->getId() !== 0) {
		/* login ok */
		$_SESSION["userid"] = $user->getId();
		$_SESSION["username"] = $user->getName();
		userData($user);
	} else {
		/* login failed */
		echo json_encode("fail");
	}
/* User logging in with session? */
} else if (isset($_SESSION["userid"]) && $_SESSION["userid"] !== 0) {
	if (isset($_POST["logout"])) {
		unset($_SESSION["userid"]);
		unset($_SESSION["username"]);
		echo json_encode("logout");
	} else {
		$user = User::newFromId($_SESSION["userid"]);
		if ($user) {
			userData($user);
		} else {
			echo json_encode("fail");
		}
	}
} else {
	echo json_encode("no");
}
?>
