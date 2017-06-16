from bread_db import BreadDB

class Category(object):
	def __init__(self, id, name, tags=None):
		self.id = id
		self.name = name
		self.tags = tags if tags else []

class Tag(BreadDB):
	_TABLE = "tag"
	_COLUMNS = ("name", "description", "category_id")
	_UNIQUE_COLUMNS = ('name',)
	
	_db = None
	def __init__(self, id, name, description, category_id):
		self.id = id
		self.name = name
		self.description = description or ""
		self.category_id= category_id or None
		self.category = self.category_id

	@classmethod
	def get_column(cls, param):
		# by default, search is by id
		try:
			int(param)
			return 'id'
		except:
			return 'name'

	@classmethod
	def query(cls, image=None):
		# ugh
		select = '''SELECT tag.id, tag.name, tag.description, category.name FROM tag LEFT JOIN category ON tag.category_id = category.id'''

		if image is None:
			return select, ()
		else:
			return (
				'''{0} LEFT JOIN tag_image on tag_id = tag.id WHERE image_id = ?'''
					.format(select),
				(image.id, )
			)
