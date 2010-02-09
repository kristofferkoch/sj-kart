<?php
header('Content-type: application/javascript; charset=UTF-8');
require_once("db.inc.php");

$name = strtolower($_GET["search"]);

$name = pg_escape_string($name);

$res = $dbh->query("SELECT geonameid, name, featureclass, featurecode, astext(position) as pos, ".
			"abs(length(name)-length('$name')) as ldiff ".
			"FROM geonames WHERE lower(name) LIKE '$name%' ORDER BY ldiff, elevation LIMIT 100");
$res or die("Error: ");

$ret = array();
foreach($res as $row) {
	preg_match('/POINT\\(([\d\.]+)\\ ([\d\.]+)\\)/', $row['pos'], $m);
	$x = (double)$m[1];
	$y = (double)$m[2];
	
	$ret[] = array(
		'id' => $row['geonameid'],
		'name' => $row['name'],
		'type' => $row['featureclass'].".".$row['featurecode'],
		'lon' => $y,
		'lat' => $x
	);
}
echo json_encode($ret);
?>
