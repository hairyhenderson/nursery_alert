#!/usr/bin/env python

class DummyScope(object):
	def clear(self):
		print "CLEARING DISPLAY"
	def show_text(self, text, color=(255,0,0)):
		print "DISPLAYING: %s" % text

