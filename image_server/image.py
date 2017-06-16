import re
import bread_db

from gb.http import Reply
from tag import Tag


class Image(bread_db.BreadDB):
	_TABLE = 'image'
	_COLUMNS = ("hash", "name", "mimetype", "description", "rudeness", "size")
	_UNIQUE_COLUMNS = ('hash', 'name')

	# image source should set this
	_DATA_DIR = None

	_ID_RE = re.compile('^[\d]{1,8}$')
	_HASH_RE = re.compile('^[a-z0-9]{40}$')
	_NAME_RE = re.compile('^.+\..{3,4}$')

	@classmethod
	def get_column(cls, value):
		'''given a unique identifier, we can deduce the type and construct the correct parameter'''
		value = str(value)
		#print value, cls._ID_RE.match(value)
		if cls._ID_RE.match(value):
			return 'id'
		elif cls._HASH_RE.match(value):
			return 'hash'
		elif cls._NAME_RE.match(value):
			return 'name'
		else:
			raise bread_db.InvalidIndexColumn(cls._TABLE, value)

	def __init__(self, id, hash, name, mimetype, description, rudeness, size):
		# db columns
		self.id = id
		self.hash = hash
		self.name = name
		self.mimetype = mimetype
		self.description = description
		self.rudeness = rudeness
		self.size = size

		# calculated attributes
		self.nice_name = '.'.join(self.name.replace('_', ' ').split('.')[:-1])
		self.link = dict(
			name = '/d/{0}'.format(self.name),
			id = '/d/{0}'.format(self.id),
			hash = '/d/{0}'.format(self.hash),
			thumb = '/tn/{0}'.format(self.hash),
		)
		# this feels inefficient, but it'll most likely do for the scale I have in mind
		self.tags = [ tag.name for tag in self._rel_tags() ]

	@property
	def real_path(self):
		return self._DATA_DIR + self.hash

	@property
	def data_reply(self):
		return Reply.filename(self.real_path, {'content-type':self.mimetype, 'Cache-Control': 'max-age=31556926'})

	@property
	def json_reply(self):
		return Reply.json(200, self.dict)


	@classmethod
	def get_untagged(cls, rudeness = 1, lower = 0):
		try:
			# only completely un-tagged images atm pls
			lower = 0
			rudeness = max(int(rudeness), 1)
			return cls(*cls.row(
				"{0} WHERE rudeness <= ? AND rudeness > 0 AND id NOT IN (SELECT image_id FROM tag_image) ORDER BY RANDOM() LIMIT 1".format(cls._SELECT()), rudeness
			))
		except IndexError:
			raise Exception('no images with {0} or fewer tags!'.format(lower))
		except ValueError:
			raise Exception('invalid param values prolly huehue')

	@classmethod
	def get_random(cls, tag=None, rudeness = 1):
		rudeness = max(int(rudeness), 1)
		if tag:
			tag_id = int(tag.id)
			return cls(*cls.row(
				""" SELECT {0} FROM image LEFT JOIN tag_image ON tag_image.image_id = image.id
						WHERE tag_image.tag_id = ?  AND rudeness <= ? AND rudeness > 0
						ORDER BY RANDOM() LIMIT 1
				""".format(cls._SELECT()),
				(tag_id, rudeness)
			))

		else:
			return cls(*cls.row(
				"{0} WHERE rudeness <= ? AND rudeness > 0 ORDER BY RANDOM() LIMIT 1".format(cls._SELECT()), 1
			))

	@classmethod
	def query(cls, count=None, before=None, after=None, at=None, rudeness=1, tag=None, order=None, dir=None, search=[], _ECOMP=False):
		if before and (after or at):
			raise Exception('BEFORE OR AFTER/AT NOT BOTH GEEZ')

		if (rudeness == 0): # homies only!!!
			RUDENESS = ''
		else:
			RUDENESS = 'AND rudeness > 0 AND rudeness <= {0} '.format(min(4, max(0, int(rudeness))))

		if tag:
			if isinstance(tag, Tag):
				tag = tag.name
			else:
				# just to make sure it's a real tag, i.e. doesn't raise exception:
				Tag.read(tag)
			TAG = "AND id IN (SELECT image_id FROM tag_image LEFT JOIN tag on tag_image.tag_id = tag.id WHERE tag.name = '{0}') ".format(tag)
		else:
			TAG = ""

		if isinstance(search, basestring): # boo but who gives a fuck
			args = ['%{0}%'.format(search)]
		elif search is not None:
			args = ['%{0}%'.format(term) for term in search]
		else:
			args = []
		
		SEARCH = "".join([" AND name LIKE ? " for _ in range(len(args))])

		ORDER = ''
		if order == 'random':
			ORDER = 'ORDER BY RANDOM() '
		else:
			if order == None or order == 'id':
				order_by = 'id'
			elif order in ('az','name','alphabetical'):
				order_by = 'name'
			else:
				raise Exception('unknown ordering "{0} {1}" requested'.format(order, dir))

			if dir == 'desc':
				order_dir = 'desc'
			else:
				order_dir = 'asc'

			# BEFORE needs a hacky mess....
			if before is not None:
				before_order_dir = 'asc' if order_dir == 'desc' else 'desc'
				ORDER = 'ORDER BY {0} {1} '.format(order_by, before_order_dir)

			else:
				ORDER = 'ORDER BY {0} {1} '.format(order_by, order_dir)

		STARTING = ''
		LIMIT = ''
		if count is not None and int(count) > 0:
			LIMIT = 'LIMIT {0} '.format(int(count))

		# only mess w/ starting_at if the query is paged and not random
		if order == 'random':
			pass
		elif after is not None or at is not None:
			# i.e., this is the last id we had before, and want more.
			# not sure how this will work with a-z sorting huehue
			comp = '<' if order_dir == 'desc' else '>'
			# this is for hacky paging bullshit. THERES GOT TO BE A BETTER WAY!
			if _ECOMP or at:
				comp += '='
			STARTING = 'AND {table}.{column} {comp} ? '.format(
				table = cls._TABLE,
				column = cls.get_column(after or at),
				comp = comp
			)
			args.append(after or at)

		elif before is not None:
			# BEFORE oh god this is a million times worse
			comp = '<' if before_order_dir == 'desc' else '>'
			if _ECOMP:
				comp += '='
			STARTING = 'AND {table}.{column} {comp} ? '.format(
				table = cls._TABLE,
				column = cls.get_column(before),
				comp = comp
			)
			args.append(before)

		query = (
			'{0} {1}{2}{3}{4}{5}{6}'
				.format(cls._SELECT(), RUDENESS, TAG, SEARCH, STARTING, ORDER, LIMIT)
				.replace(' AND ', ' WHERE ', 1)
		)

		# before has one more crime to commit: put the shit back in original order
		if before is not None:
			query = "SELECT * FROM ( {0} ) ORDER BY {1} {2} ".format(query, order_by, order_dir)

		#print query, args
		return query, args

	def _rel_tags(self):
		return Tag.browse(image=self)

