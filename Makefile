
all: geonames_import featurecodes.js


clean:
	rm -f NO.zip NO.txt featureCodes_nb.txt featurecodes.js
	
jslint.js:
	wget http://jslint.com/rhino/jslint.js
NO.zip:
	wget http://download.geonames.org/export/dump/NO.zip
NO.txt: NO.zip
	unzip NO.zip NO.txt
geonames_import: NO.txt
	python importGeonames.py < NO.txt
	
featureCodes_nb.txt:
	wget http://download.geonames.org/export/dump/featureCodes_nb.txt
featurecodes.js: featureCodes_nb.txt
	python featurejson.py < featureCodes_nb.txt > featurecodes.js

