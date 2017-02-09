#!/usr/bin/env python
#
import unittest
from mock import Mock
import AlertListener
from AlertListener import AlertHandler

class AlertHandlerTest(unittest.TestCase):
	def setUp(self):
		self.displayer = Mock()
		AlertListener.scope = self.displayer
		self.a = AlertHandler()
		self.a.send_response = Mock()

	def test_put(self):
		self.a.path = "/abcd"
		self.a.do_PUT()

		self.displayer.show_text.assert_called_with("abcd")
		self.a.send_response.assert_called_with(201)

	def test_put_with_bad_code(self):
		self.a.path = "/foobar"
		self.a.do_PUT()

		self.a.send_response.assert_called_with(404)

	def test_delete(self):
		self.a.do_DELETE()

		self.displayer.clear.assert_called_with()
		self.a.send_response.assert_called_with(204)

if __name__ == "__main__":
	unittest.main()
