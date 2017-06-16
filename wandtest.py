import wand.image
import wand.display

#hsh = '4d77c2cc3d5d73c720ab5d6f510fe2c7efb79222'
TW = 120
TH = 120

present = open('tnlst').read().split();

for hsh in open('imglst').read().split():
	if hsh in present:
		print hsh, 'present!'
		continue
	try:
		img = wand.image.Image(filename='/home/data/i/{0}'.format(hsh))
		tn = img.sequence[0].clone()
		tn.format = 'png'

		w, h = tn.size

		if w > h:
			tn.crop(left = (w - h)/2, top = 0, width = h, height = h)

		elif h > w:
			tn.crop(left = 0, top  = (h - w)/2, width = w, height = w)

		tn.sample(width = TW, height = TH)
		tn.save(filename='/home/data/tn/{0}'.format(hsh))

	except Exception as e:
		print hsh, "FAIL", e

	else:
		print hsh, 'ok'

