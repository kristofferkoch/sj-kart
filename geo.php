<?php
header('Content-type: application/javascript; charset=UTF-8');
require_once("db.inc.php");

function output($bbox) {
	global $dbh;
	if (count($bbox) !== 4) return;
	
	$ret = array('type' => 'FeatureCollection');
	$features = array();
	#echo "/*";
	$a = (double)$bbox[0];
	$b = (double)$bbox[1];
	$c = (double)$bbox[2];
	$d = (double)$bbox[3];
	$q = "SELECT geonameid, name, featureclass, featurecode, astext(position) as pos ".
		"FROM geonames WHERE position && 'BOX($b $a, $d $c)'::box2d LIMIT 500";
	$r = $dbh->query($q);
	
	foreach($r as $row) {
		preg_match('/POINT\\(([\d\.]+)\\ ([\d\.]+)\\)/', $row['pos'], $m);
		$x = (double)$m[1];
		$y = (double)$m[2];
		$feature = array(
				'type' => 'Feature',
				'id' => $row['geonameid'], 
				'geometry' => array(
					'type' => 'Point',
					'coordinates' => array($y, $x)
				),
				'properties' => array('name' => $row['name'],
									'source' => 'geonames',
									'type' => $row['featureclass'].".".$row['featurecode']
				)
			);
		$features[] = $feature;
		//print $row['pos']."(".$row['featurecode']."): ".$row['name']."\n";
	}
	
/*	$q = "SELECT id, version, userid, editcomment, name, wiki, json, point ".
		"FROM poi WHERE version=MAX(version)";*/
	#echo "*/\n";
	
	$ret['features'] = $features;
	echo json_encode($ret);
}

output(explode(",",$_GET["bbox"],4));
?>

