<?php
header('Content-type: application/javascript; charset=UTF-8');
require_once("db.inc.php");

$name = strtolower($_GET["search"]);

$name = pg_escape_string($name);

$res = $dbh->query("SELECT geonameid, name, featureclass, featurecode, astext(position) as pos ".
			"FROM geonames WHERE lower(name) LIKE '%$name%' LIMIT 100");

$ret = array();
foreach($res as $row) {
	$ret[] = array(
		'id' => $row['geonameid'],
		'name' => $row['name'],
		'type' => $row['featureclass']+"."+$row['featurecode'],
		'position' => $row['pos']
	);
}
echo json_encode($ret);
?>
