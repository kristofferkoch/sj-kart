
.PHONY: clean all check update clean_downloaded

all: geonames_import featurecodes.js openlayers/OpenLayers.js

update: clean_download all

clean_download:
	rm -f featureCodes_nb.txt NO.zip

clean: clean_download
	rm -f NO.txt featurecodes.js jslint.js
	
check: jslint.js
	rhino jslint.js measure.js
	rhino jslint.js statekeeper.js
	rhino jslint.js autoswitcher.js
	rhino jslint.js kart.js
	rhino jslint.js search.js
	rhino jslint.js bruker.js
	rhino jslint.js status.js

jslint.js:
	wget http://jslint.com/rhino/jslint.js
NO.zip:
	wget -N http://download.geonames.org/export/dump/NO.zip
	
NO.txt: NO.zip
	unzip -o NO.zip $@
	
geonames_import: NO.txt
	python importGeonames.py < NO.txt
	touch geonames_import
	
featureCodes_nb.txt:
	wget -N http://download.geonames.org/export/dump/featureCodes_nb.txt
featurecodes.js: featureCodes_nb.txt
	python featurejson.py < featureCodes_nb.txt > featurecodes.js

openlayers/build/OpenLayers.js:
	cp kart.cfg openlayers/build
	cd openlayers/build && python build.py kart.cfg

openlayers/OpenLayers.js: openlayers/build/OpenLayers.js
	cd openlayers/ && ln -s build/OpenLayers.js .
