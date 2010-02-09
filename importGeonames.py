from sys import stdin
import pg

con = pg.connect(dbname="kyst")

def s(s, comma = True):
    r = "'"+pg.escape_string(s)+"'"
    if comma:
        r += ", "
    return r

def i(s):
    if not s:
        return "NULL, "
    return str(int(s)) + ", "

q = "DELETE FROM geonames";
con.query(q);

for line in stdin:
    line = line.split("\t")
    assert len(line) == 19
    #print line
    q = "INSERT INTO geonames (geonameid, name, asciiname, alternatenames, position, " + \
        "featureclass, featurecode, countrycode, countrycode2, admin1, admin2, admin3, admin4, " + \
        "population, elevation, gtopo30, timezone, modifydate) " + \
        "VALUES(" + \
        i(line[0]) + \
        s(line[1]) + \
        s(line[2]) + \
        s(line[3]) + \
        ("GeomFromText('POINT(%f %f)', -1), " % (float(line[4]), float(line[5]))) + \
        s(line[6]) + \
        s(line[7]) + \
        s(line[8]) + \
        s(line[9]) + \
        s(line[10]) + \
        s(line[11]) + \
        s(line[12]) + \
        s(line[13]) + \
        i(line[14]) + \
        i(line[15]) + \
        i(line[16]) + \
        s(line[17]) + \
        s(line[18], False) + ")"
    #print q;
    con.query(q)
    #break

q = "UPDATE geonames SET elevation=0 WHERE elevation IS NULL AND featureclass='H' AND featurecode = 'FJD'"
con.query(q);

