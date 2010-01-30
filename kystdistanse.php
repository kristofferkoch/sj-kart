<?php
	$pg = pg_pconnect("dbname=kyst") or die("Cannot connect to db");
	
	$lat = $_GET["lat"];
	$lon = $_GET["lon"];
	
	if (!(is_numeric($lat) and is_numeric($lon))) {
		die("Usage: ?lat={num}&lon={num}");
	}
	
	$lat = floatval($lat);
	$lon = floatval($lon);
	
	$radius = 6391; #km, approx in Norway
	$maxdist_km = 30;
	$maxdist_rad = $maxdist_km/$radius; # in radians
	$maxdist_deg = ($maxdist_rad*360)/(2*M_PI);
	
	$q = "SELECT ST_Distance(GeomFromText('POINT({$lat} {$lon})',4326), linestring) AS dist ".
			"FROM ways AS w, way_tags AS t ".
			"WHERE t.k = 'natural' AND t.v = 'coastline' ".
			"AND t.way_id = w.id ".
			"AND ST_DWithin(GeomFromText('POINT({$lat} {$lon})',4326), linestring, {$maxdist_deg}) ".
			"ORDER BY dist asc LIMIT 1;";
	
	$r = pg_query($pg, $q);
	
	$r = pg_fetch_row($r);
	
	if ($r) {
		$dist_deg = $r[0];
		$dist_rad = ($dist_deg*2*M_PI)/360;
		$dist_km  = $dist_rad*$radius;
		echo $dist_km;
	} else {
		echo ">".$maxdist_km;
	}
	
?>
