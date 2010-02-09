<?php
header('Content-type: application/javascript; charset=UTF-8');
require_once("db.inc.php");
setlocale(LC_ALL, "no_NO.UTF8");

$name = mb_strtolower($_GET["search"], "UTF-8");

$name = pg_escape_string($name);

$res = $dbh->query("SELECT geonameid, name, featureclass, featurecode, astext(position) as pos, ".
			"abs(length(name)-length('$name')) as ldiff ".
			"FROM geonames WHERE lower(name) LIKE '$name%' ORDER BY ldiff, elevation, population DESC LIMIT 100");
$res or die("Error: ");

$ret = array();
$exact = false;
foreach($res as $row) {
	if (mb_strtolower($row['name'], "UTF-8") === $name) {
		$exact = true;
	} else if ($exact) {
		break;
	}
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
