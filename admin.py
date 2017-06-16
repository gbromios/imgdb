#!/usr/bin/env python

import gb.options
import sys

from image_server import bread_db
from image_server.image import Image
from image_server.tag import Tag

try:
	opts = gb.options.Options.from_path('/home/settings.conf') # hhahah
except IOError:
	print 'dont forget to make your options in "data/settings.conf (see sample.conf)"'

try:
	db_path = sys.argv[1]
except IndexError:
	db_path = opts.db_path

bread_db.BreadDB.connect(db_path)
print(" + loaded db {0} +".format(db_path))

def ex(*args, **kwargs):
	return bread_db.BreadDB._execute(*args, **kwargs)

def untagged():
	u = ex('SELECT COUNT(*) FROM image WHERE id NOT IN (SELECT image_id FROM tag_image) ')[0][0]
	c = ex('SELECT COUNT(*) FROM image ')[0][0]
	print '{0}/{1} images still untagged ({2:.3f}%)'.format(u, c, 100*(float(u)/float(c)))

i = Image.get_random()
t = Tag.read('doggy')
' + loaded example Image (i) and Tag (t)'
