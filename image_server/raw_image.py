import os, subprocess, mimetypes
from image import Image
from gb.http import Reply

class ImageSource(object):

	def __init__(self, raw_dir, dest_dir, thumb_dir):
		self.raw_dir = raw_dir
		self.dest_dir = dest_dir
		self.thumb_dir = thumb_dir

		Image._DATA_DIR = self.dest_dir

	def thumb_reply(self, hash):
		return Reply.filename(os.path.join(self.thumb_dir, hash), {'content-type':'image/png', 'Cache-Control': 'max-age=31556926'})

	def next_raw_page(self):
		"""returns the 'next from import queue' page"""
		try:
			r = subprocess.check_output(["find", self.raw_dir, "-type", "f"]).split('\n',1)[0]
			if not r:
				return Reply.text(404, "<html>No more images.</html>")
			o = subprocess.check_output(["sha1sum", r]).split()
			hash, path = o[0], ' '.join(o[1:])
			print "'%s %s'" % (hash, path)

			cleanpath = path.replace(' ', '_')
			for c in "'!&?\"\\":
				cleanpath = cleanpath.replace(c, '')

			body = """<!DOCTYPE html><html>
			<body>
				<p>mv "{path}" "{cleanpath}"</p>
				<p>{hash}</p>
				<form action="/image" method="POST" enctype="application/x-www-form-urlencoded">
				<label>Desrcibe<textarea name=description></textarea><label>
				<label>rudeness
					<select name=rudeness>
						<option value=0>???</option>
						<option value=1 selected>Nice</option>
						<option value=2>Rude</option>
						<option value=3>Natty</option>
						<option value=4>Foul</option>
						<option value=5>Unthinkable</option>
					</select>
				</label>
				<input type="hidden" name="path" value="{path}" />
				<button type="submit">ok yes</button>
				</form><br/>
				<img src="{url}"/>
			</body>
			</html>""".format(path=path, cleanpath=cleanpath, hash=hash, url=path.lstrip('data')).replace('\n\t\t\t', '\n')

			return Reply.text(200, body, "text/html")


		except Exception as e:
			print e
			return (None, None)

	def migrate(self, path, description='', rudeness=0):
		"""takes an unprocess image file from raw_dir and makes a new image.Image object"""
		assert (path.startswith(self.raw_dir))
		try:
			hash_, name_ = subprocess.check_output(["sha1sum", path]).split()
			print "!!!!!  ", hash_, "  !!!!!"
			Image.add(
				hash = hash_,
				name = path.split('/')[-1],
				mimetype = mimetypes.guess_type(path)[0],
				description = description.translate(None, "\'\"")[:1024],
				rudeness = max(min(int(rudeness), 5), 0),
				size = os.path.getsize(path),
			)
			image = Image.read(hash=hash_)
			assert image is not None, "no image returned!"

		except Exception as e:
			print "error while adding new image to db", e
			raise

		else:
			print 'image created, moving file!'
			dest_path = os.path.join(self.dest_dir, hash_)

			subprocess.check_output(["mv", path, dest_path])
			#os.rename(path, dest_path)
			return image
