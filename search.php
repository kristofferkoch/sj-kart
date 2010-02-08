<?php
header('Content-type: application/javascript; charset=UTF-8');
require_once("db.inc.php");

$name = strtolower($_GET["search"]);

$name = pg_escape_string($name);

$res = $dbh->query("SELECT geonameid, name, featureclass, featurecode, astext(position) as pos ".
			"FROM geonames WHERE lower(name) LIKE '%$name%' LIMIT 100");

foreach($res as $row) {
	var_dump($row);
}

?>
