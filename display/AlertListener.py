#!/usr/bin/env python
#
import SimpleHTTPServer
import SocketServer
import logging
import socket
import sys
import os

logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)

logging.info("AlertListener at pid %d", os.getpid())
pidfile = open("/var/run/nursery-alert-display.pid", "w")
pidfile.write(str(os.getpid()))
pidfile.close()

scope = None

def getScope():
	return scope

class AlertHandler(object):
	"""An HTTP request handler for the Nursery Alert system."""
	def do_PUT(self):
		""" PUT /:code
			Displays the named alert. Returns a 204.
		"""
		if self.path.startswith("/") and len(self.path) <= 5:
			code = self.path[len("/"):]
			getScope().show_text(code)
			self.send_response(201)
		else:
			self.send_response(404)


	def do_DELETE(self):
		""" Clears the display immediately - the path is irrelevant here """
		getScope().clear()
		self.send_response(204)

class AlertListener(SimpleHTTPServer.SimpleHTTPRequestHandler, AlertHandler):
	""" """
	def log_message(self, format, *args):
		logging.info(format, *args)

	def do_GET(self):
		""" GET / - returns status... """
		self.send_response(200)

if __name__ == "__main__":
	logging.info("Initializing Framebuffer...")
	from PyScope import PyScope
	try:
		scope = PyScope()
	except:
		logging.exception("PyScope blew up...")
		sys.exit(1)
	#from DummyScope import DummyScope
	#scope = DummyScope()

	if len(sys.argv) > 1:
		PORT = int(sys.argv[1])
	else:
		PORT = 4000
	HOST = "localhost"
	logging.info("Binding to port %d" % PORT)
	httpd = None
	while httpd is None:
		try:
			httpd = SocketServer.TCPServer((HOST, PORT), AlertListener)
		except socket.error, err:
			if err.errno == 98 or err.errno == 48:
				continue
			else:
				raise err
				break
	logging.info("Listening on port %d" % PORT)
	httpd.serve_forever()
	logging.info("quitting")
else:
	from DummyScope import DummyScope
	scope = DummyScope()
