import gb.http
from gb.http import route, Reply

import json, re, socket, traceback, random
import bread_db
from image import Image
from tag import Tag
from raw_image import ImageSource

class ImageHandler(gb.http.Handler):
	whitelist = []
	app_root = None
	image_source = None
	hostname = None

	@property
	def allowed(self):
		# TODO: actual permissions
		return self.client_address[0] in self.whitelist

	def handle_one_request(self):
		"""Handle a single HTTP request."""
		try:
			self.raw_requestline = self.rfile.readline(65537)
			if len(self.raw_requestline) > 65536:
				self.requestline = ''
				self.request_version = ''
				self.command = ''
				self.send_error(414)
				return
			if not self.raw_requestline:
				self.close_connection = 1
				return
			if not self.parse_request():
				# An error code has been sent, just exit
				return

			# gb.http.Handler overrides
			#

			if self.command not in self.routers:
				self.send_error(400, "Unsupported method '{0}'".format(self.command))
				return

			# here is the dispatch: the router is selected based on the http
			# method (e.g. GET, POST, PUT); then based on the path segment of
			# the url, the router matches each route in desc. order of priority
			# and is guaranteed to get a gb.http.Reply in return, which we know
			# how to send

			method = self.routers[self.command](self.path_no_qs)
			if method is None:
				self.send_error(404, "no route matched '{0}'".format(self.path_no_qs))
				return

			try:
				reply =  method(self) #getattr(self, name)()
			except Exception as e:
				self.send_error(500, "exception in handler class")
				raise e

			# heh, this could be cleaned up but unfortunately im lazy but also
			# appreciate fresh looking address bars at least in dev
			if self.headers.getheader('Origin'):
				reply.headers['Access-Control-Allow-Origin'] = self.headers.getheader('Origin')
			self.send_http_reply(reply)

			# end custom part
			#

			self.wfile.flush() #actually send the response if not already done.
		except socket.timeout, e:
			#a read or a write timed out.  Discard this connection
			self.log_error("Request timed out: %r", e)
			self.close_connection = 1
			return

	# STATIC ###################################################################

	@route('GET', '/s/.*')
	def get_static(self):
		return self.serve_path('static/' + '/'.join(self.split_path[1:]))

	@route('GET', '/js/.*')
	def get_js(self):
		return self.serve_path('js_app/' + '/'.join(self.split_path[1:]))

	@route('GET', '/favicon.ico')
	def get_favicon(self):
		return self.serve_path('static/favicon.ico')

	def serve_path(self, path):
		# TODO root dir should come from the config
		if '..' in path:
			return Reply.text(403, "NICE TRY HACKER SCUM")
		try:
			return Reply.filename(self.app_root + path)
		except IOError:
			return Reply.text(404, 'cant find ' + '/'.join(self.split_path[1:]))

	@route('GET', '/robots.txt')
	def get_robots(self):
		return Reply.text(200, 'User-agent: *\nDisallow: /')

	# FRONT PAGE ###
	@route('GET', '/?')
	def get_root_page(self):
		# use a sane default
		args = self.request_data
		if 'count' not in args:
			args['count'] = 100 # just a sane default pls
		with open(self.app_root + '/static/index.html') as f:
			document = ( f.read()
				.replace('[[IMAGES]]', self.item_json(Image.browse(**args), Image.paging(**args)))
				.replace('[[TAGS]]', self.item_json(Tag.browse()))
			)
		return Reply.text(200, document, 'text/html')

	# CATCH ALL ###
	@route('GET', '.*', -1)
	def get_catchall(self):
		return self.get_root_page()

	# IMAGES ###
	def item_json(self, items, paging=None, escape=True, debug=True):
		if paging is not None:
			data = dict(
				items = [i.dict for i in items],
				paging = paging
			)
		else:
			data = [i.dict for i in items]

		body = json.dumps(data, indent = 2 if debug else None)
		if escape:
			return body.replace('<!--', '<\\!--').replace('<script', '<\\script').replace('</script', '<\\/script')
		else:
			return body

	@route('GET', '/i')
	def browse_images(self):
		args = self.request_data
		try:
			if 'rudeness' in args and args['rudeness'] == 0 and not self.allowed:
				raise Exception('WHY DOST THOU HACKEST MINE SITES')

			return Reply.text(
				200,
				json.dumps(dict(
					data = [i.dict for i in Image.browse(**args)],
					paging = Image.paging(**args)
				), indent=2, sort_keys=True),
				"application/json; charset=utf-8"
			)

			return Reply.json(
				200,
				dict(
					data = [i.dict for i in Image.browse(**args)],
					paging = Image.paging(**args)
				),
			)

			return Reply.text(200, self.item_json(Image.browse(**args), escape=False), "application/json; charset=utf-8")
		except Exception as e:
			return Reply.text(400, "Bad parameters: " + str(self.request_data) + '\n' + str(e) )

	@route('GET', '/[id]/.+')
	def read_image(self):
		try:
			image = Image.read(self.split_path[1])

			if image.rudeness == 0 and not self.allowed:
				return Reply.text(400, "Bad parameters: " + str(self.request_data))

			if self.split_path[0] == 'd':
				return image.data_reply
			elif self.split_path[0] == 'i':
				return image.json_reply

		except bread_db.InvalidIndexColumn as e:
			return Reply.text(400, str(e))

		except Exception as e:
			return Reply.text(500, "500: sorry, can't read image:\n" + str(e))

	@route('GET','/tn/[0-9a-f]{40}')
	def get_thumbnail(self):
		try:
			return self.image_source.thumb_reply(self.split_path[1])
		except:
			# i choose this for the default thumb. make it configurable later.
			return self.image_source.thumb_reply('00739fe818a1a764328371b7bbb2ad072367f1e3')

	@route('GET','/[\d]{1,8}', 20)
	def get_one_image_id(self):
		return self.get_one_image()

	@route('GET','/[^/]+\..{3,4}')
	def get_one_image_name(self):
		return self.get_one_image()

	@route('GET','/[a-z0-9]{40}')
	def get_one_image_hash(self):
		return self.get_one_image()

	@route('GET', '/tagme/.+', 20)
	def get_untagged_id(self):
		return self.get_one_image(self.split_path[1])

	@route('GET', '/tagme/?', 20)
	def get_untagged(self):
		return self.get_one_image(Image.get_untagged().id)

	def get_one_image(self, path = None):
		if path is None:
			path = self.split_path[0]

		args = self.request_data
		# TODO can get rid of this when paging is more sophisticated
		args['at'] = Image.read(path).id
		if not args.get('count', 0):
			args['count'] = 100

		with open(self.app_root + '/static/index.html') as f:
			document = ( f.read()
				.replace('[[IMAGES]]', self.item_json(Image.browse(**args), Image.paging(**args)))
				.replace('[[TAGS]]', self.item_json(Tag.browse()))
			)
		return Reply.text(200, document, 'text/html')

	# careful not to steal requests for image by id
	@route('GET', '/[\w]{2,39}', 15)
	def get_images_tagged(self):
		args = self.request_data
		if 'count' not in args:
			args['count'] = 100 # sanity defaul00
		args['tag'] = self.split_path[0]
		with open(self.app_root + '/static/index.html') as f:
			document = ( f.read()
				.replace('[[IMAGES]]', self.item_json(Image.browse(**args), Image.paging(**args)))
				.replace('[[TAGS]]', self.item_json(Tag.browse()))
			)
		return Reply.text(200, document, 'text/html')

	@route('GET', '/tags', 16)
	def get_all_tags(self):
		with open(self.app_root + '/static/index.html') as f:
			document = ( f.read()
				.replace('[[IMAGES]]', self.item_json([], []))
				.replace('[[TAGS]]', self.item_json(Tag.browse()))
			)
		return Reply.text(200, document, 'text/html')

	# lazy agian :I
	@route('POST', '/ti')
	def tag_image(self):
		try:
			assert(self.allowed)
			QUERY = 'INSERT INTO tag_image(image_id, tag_id) VALUES(?, ?)'
			iid = int(self.request_data['image_id'])
			tid = Tag.read(self.request_data['tag']).id
			bread_db.BreadDB._execute(QUERY, (iid, tid))
			return Reply.json(200, self.request_data)
		except Exception as e:
			return Reply.json(400, dict(message='bad request /ti' + str(e), request=self.request_data))

	@route('POST', '/tc')
	def tag_category(self):
		assert self.allowed
		tid = int(self.request_data['tag_id'])
		cid = str(self.request_data['category'])
		try:
			tag = Tag.read(tid)
			tag.set_category(cid)
			return Reply.text(200, "success! {0} is {1}".format(tag.name, cid))
		except Exception as e:
			return Reply.text(500, "error: {0}".format(e))
