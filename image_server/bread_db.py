import sqlite3, re, json

class BreadDB(object):
	# NAME OF TABLE IN SQL
	_TABLE = None
	# COLUMN NAMES (IN ORDER!!!) FOR SQL HWERE CLAUSES AND SELECT OR WHATEVER
	_COLUMNS = tuple()
	# INDEXED COLUMNS.......FOR SQL WHAT DID YA THINK
	_UNIQUE_COLUMNS = tuple()

	@classmethod
	def _STAR(cls, table=True):
		if cls is BreadDB:
			raise Exception('_STAR on subclasses only')
		columns = ("id",) + cls._COLUMNS
		if table:
			return ', '.join('{0}.{1}'.format(cls._TABLE, c) for c in columns)
		else:
			return ', '.join("{0}".format(c) for c in columns)

	@classmethod
	def _SELECT(cls, table=True):
		return 'SELECT {0} FROM {1}'.format(cls._STAR(), cls._TABLE)

	__db = None

	@classmethod
	def connect(cls, path):
		# definitely need to find a more appropriate venue for these methods.
		cls.__db = sqlite3.connect(path)
		# haven't figureo out how to do startup yet :(
		cls._execute(
			"""CREATE TABLE IF NOT EXISTS image (
				id INTEGER PRIMARY KEY NOT NULL,
				hash TEXT UNIQUE NOT NULL,
				name TEXT UNIQUE COLLATE NOCASE NOT NULL,
				mimetype TEXT,
				description TEXT,
				rudeness INTEGER NOT NULL DEFAULT 0,
				size INTEGER NOT NULL
			)
			"""
		)

		cls._execute(
			"""CREATE TABLE IF NOT EXISTS tag (
				id INTEGER PRIMARY KEY NOT NULL,
				name TEXT NOT NULL,
				description TEXT,
				category_id INTEGER
			)
			"""
		)

		cls._execute(
			"""CREATE TABLE IF NOT EXISTS tag_image (
				image_id INTEGER NOT NULL,
				tag_id INTEGER NOT NULL,
				PRIMARY KEY (image_id, tag_id)
				FOREIGN KEY (image_id) REFERENCES image(id) ON DELETE CASCADE
				FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
				)
			"""
		)

		cls._execute(
			"""CREATE TABLE IF NOT EXISTS category (
				id INTEGER PRIMARY KEY,
				name TEXT
			)
			"""
		)

	@classmethod
	def _execute(cls, query, args=[]):
		try:
			#print 'QUERY:', query
			#print 'ARGS :', args
			cursor = cls.__db.cursor()
			results = list(cursor.execute(query, args))
			cls.__db.commit()
			cursor.close()
			return results
		except:
			raise

	@classmethod
	def rows(cls, query, args):
		""""""
		#print ' -- '
		#print select_query
		#print args
		return list(cls._execute(query, args))

	@classmethod
	def row(cls, query, param):
		if 'LIMIT 1' not in query:
			print ('warning: looks like an unlimited query for one row')
		try:
			return cls.rows(query, (param,))[0]
		except IndexError:
			return None

	@classmethod
	def get_column(cls, param):
		# by default, search is by id
		try:
			int(param)
			return 'id'
		except:
			raise InvalidIndexColumn(cls._TABLE, param)

	@classmethod
	def query(cls, **kwargs):
		# all args must have a name. expect to deal with count and paging data type stuff
		# should return (query_string, *positional_args)
		print('Using generic select query...')
		return cls._SELECT()

	# args has some stanards that arent yet codified. that oughta be fun
	@classmethod
	def browse(cls, **kwargs):
		query, args = cls.query(**kwargs)
		return [cls(*row) for row in cls._execute(query, args)]

	# call the withe same args as browse to get paging for htat query
	@classmethod
	def paging(cls, **kwargs):
		# OKAY: DO OVER should be less complicated than how I'm doing it currently.
		# page numbers are for assholes anyway
		# we want: the total number of items in this query,
		# items before and after this "page"
		# and the first and last items overall.

		# In all honesty, this is probably brutally inefficient. we're basically
		# doing five extra queries there's probably a much nicer sql-friendly way
		# to do this but I cant be assed to figure it out atm. something about...
		# rownum? sqlite doesn't have that shit man

		# obviously random order has no paging. this is specific to image class,
		# need to make valid order columns a generic thing at some point
		order_col = kwargs.get('order')
		if order_col == 'random':
			total_query, total_args = cls.query(**kwargs)
			total_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', total_query, 1)
			total_count = cls._execute(total_query, total_args)[0][0]
			return dict( total_count = total_count )

		elif order_col in ('az', 'name', 'alphabetical'):
			order_col = 'name'
		elif order_col in (None, 'id'):
			order_col = 'id'

		# no count... seems like a special case-ish?
		count = kwargs.pop('count', None)

		after = kwargs.pop('after', None)
		at = kwargs.pop('at', None)
		before = kwargs.pop('before', None)

		if at and not after:
			after = at

		# default ordering is asc.
		dir = kwargs.pop('dir', 'asc')

		if before and after:
			raise Exception('cant use before and after in the same query dingus')
		if dir not in ('asc', 'desc'):
			raise Exception('cant do anything with unknown ordering direction "{0}"'.format(dir))

		# selecting 10 rows, mixing dirs / offsets. total items == 1000 for all cases. yay.
		# [ scenario ]           [ query results ]  [ paging data ]
		# id asc, after 100:     101, 102, ... 110; first 1, last 1000, prev_ct 100, next_ct 890
		# id desc, after 100:     99,  98, ...  90; first 1000, last 1, prev_ct 901, next_ct 89
		# id asc, before 100:     90,  91, ...  99; first 1, last 1000, prev_ct 89,  next_ct 901
		# id desc, before 100:   110, 109, ... 101; first 1000, last 1, prev_ct 890, next_ct 100

		total_query, total_args = cls.query(**kwargs)
		total_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', total_query, 1)
		total_count = cls._execute(total_query, total_args)[0][0]

		first_query, first_args = cls.query(dir='asc', count=1, **kwargs)
		first_query = re.sub('SELECT.*?FROM', 'SELECT id FROM', first_query, 1)
		first_item = cls._execute(first_query, first_args)[0][0]

		last_query, last_args = cls.query(dir='desc', count=1, **kwargs)
		last_query = re.sub('SELECT.*?FROM', 'SELECT id FROM', last_query, 1)
		last_item = cls._execute(last_query, last_args)[0][0]

		# the first item for a desc query is the last for an asc and vise versa
		if dir == 'desc':
			last_item, first_item = first_item, last_item

		# figuring out number of items before/after
		# asc, after:
		#   next_ct: (items > $id) - $count (max of 0)
		#   prev_ct: (items =< $id)
		# asc, before:
		#   next_ct: (items < $id) - $count (max of 0)
		#   prev_ct: (items >= $id)

		next_ct, prev_ct = None, None
		if (after and dir == 'asc') or (before and dir == 'desc'):
			after = before if after is None else after
			# we have to do math on these results!
			next_ct_query, next_ct_args = cls.query(dir='asc', after=after, **kwargs)
			next_ct_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', next_ct_query, 1)
			next_ct = 0 if count is None else max(cls._execute(next_ct_query, next_ct_args)[0][0] - count, 0)

			# this _ECOMP malarky... a heinous way to for <= or >= (feels badman)
			prev_ct_query, prev_ct_args = cls.query(dir='asc', before=after, _ECOMP=True, **kwargs)
			prev_ct_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', prev_ct_query, 1)
			prev_ct = cls._execute(prev_ct_query, prev_ct_args)[0][0]

			if (before and dir == 'desc'):
				prev_ct, next_ct = next_ct, prev_ct

		elif (before and dir == 'asc') or (after and dir == 'desc'):
			before = after if before is None else before
			next_ct_query, next_ct_args = cls.query(dir='asc', before=before, **kwargs)
			next_ct_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', next_ct_query, 1)
			next_ct = 0 if count is None else max(cls._execute(next_ct_query, next_ct_args)[0][0] - count, 0)

			prev_ct_query, prev_ct_args = cls.query(dir='asc', after=before, _ECOMP=True, **kwargs)
			prev_ct_query = re.sub('SELECT.*?FROM', 'SELECT COUNT(*) FROM', prev_ct_query, 1)
			prev_ct = cls._execute(prev_ct_query, prev_ct_args)[0][0]

			if (after and dir == 'desc'):
				prev_ct, next_ct = next_ct, prev_ct

		elif after is None and before is None:
			# this is an easier case... huehue
			prev_ct = 0
			next_ct = 0 if count is None else max(total_count - count, 0)

		else:
			raise Exception('looks like you messed up this insanely convulated logic, woops')

		return dict(
			total_count = total_count,
			first_item = first_item,
			last_item = last_item,
			items_before = prev_ct,
			items_after = next_ct
		)

	@classmethod
	def read(cls, param):
		select = cls._SELECT()
		column = cls.get_column(param)
		query = "{0} WHERE {1} = ? LIMIT 1".format(select, column)
		row = cls.row(query, param)
		if row is None:
			raise RowNotFound(cls._TABLE, column, param)
		return cls(*row)

	@classmethod
	def add(cls, **kwargs):
		assert (len(kwargs) == len(cls._COLUMNS)), "must supply all non-id args!"

		UARGS = ' OR '.join(['{0} = ?'.format(c) for c in cls._UNIQUE_COLUMNS])
		UVALUES = [kwargs[c] for c in cls._UNIQUE_COLUMNS]

		#print UARGS, UVALUES, ' ========='
		extant_rows = cls.execute(
			"{SELECT} WHERE {ARGS}".format(
				SELECT = cls._SELECT(),
				ARGS = UARGS
			),
			UVALUES
		)
		if extant_rows:
			raise ValueError("conflicting {type} already exists\n\n{link}\n\n{rows}".format(
				type = cls._TABLE,
				rows = str(extant_rows),
				link = "/i/{0}".format(kwargs['hash'])
			))

		query = "INSERT INTO {TABLE}({COLUMNS}) VALUES ({ARGS})".format(
			TABLE = cls._TABLE,
			COLUMNS = ", ".join(cls._COLUMNS),
			ARGS = ", ".join(["?" for i in range(len(cls._COLUMNS))])
		)
		VALUES = [kwargs[c] for c in cls._COLUMNS]
		#print "add: ({0}, {1})".format(query, VALUES)
		cls._execute(query, VALUES)

	# for dumping into json replies
	@property
	def dict(self):
		return self.__dict__.copy()

	def __str__(self):
		return json.dumps(self.dict)

class InvalidIndexColumn(ValueError):
	def __init__(self, table, value):
		super(InvalidIndexColumn, self).__init__(
			"could not map {0} to any index column of {1}".format(value, table)
		)

class RowNotFound(IndexError):
	def __init__(self, table, column, index):
		super(RowNotFound, self).__init__(
			'no {0} found with `{1}` = {2}'.format(table, column, repr(index))
		)
