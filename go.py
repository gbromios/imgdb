#!/usr/bin/env python2

from image_server.server import ImageHandler
from image_server.raw_image import ImageSource
from image_server.bread_db import BreadDB

from gb.options import Options
from gb.http import Server, SSLServer

import sys

try:
	options = Options.from_path(sys.argv[1])
except IOError as e:
	print e,
	print ''
	print 'usage:	go.py /path/to/settings.conf'
	sys.exit(1)

db_path = options.db_path

BreadDB.connect(db_path)

# configure some rando options (better things to come~)
ImageHandler.whitelist = options.whitelist
ImageHandler.hostname = options.hostname
ImageHandler.app_root = options.app_root
ImageHandler.image_source = ImageSource(**options.image_source)

import json

# letter rip
if options.use_ssl:
	SSLServer(handler = ImageHandler, **options.ssl_server).serve_forever()

else:
	Server(handler = ImageHandler, **options.server).serve_forever()

