<?php
header('Content-type: application/javascript');


chdir("/usr/share/mediawiki/");
require_once("/usr/share/mediawiki/includes/WebStart.php");
require_once("/usr/share/mediawiki/includes/Exception.php");
require_once("/usr/share/mediawiki/includes/User.php");
require_once("/usr/share/mediawiki/includes/Setup.php");

#echo "/*\n";
#var_dump($_SESSION);
#echo "*/\n";

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
		$_SESSION["wsUserID"] = $user->getId();
		$_SESSION["wsUserName"] = $user->getName();
		userData($user);
	} else {
		/* login failed */
		echo json_encode("fail");
	}
/* User logging in with session? */
} else {
	$user = User::newFromSession();
	if ($user->getId() !== 0) {
		if (isset($_POST["logout"])) {
			$user->logout();
			echo json_encode("logout");
		} else {
			userData($user);
		}
	} else {
		echo json_encode("no");
	}
}
?>
