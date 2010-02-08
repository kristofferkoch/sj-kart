#!/bin/python
import simplejson
from sys import stdin, stdout

todump = {}

for l in stdin:
	l = l.split("\t");
	todump[l[0]] = l[1]
	
simplejson.dump(todump, stdout);

