#!/usr/bin/env python
#
import unittest
from mock import Mock
import PyScope

class PyScopeTest(unittest.TestCase):
	def setUp(self):
		PyScope.pygame = Mock()
		self.scope = PyScope.PyScope()
		self.scope.screen = Mock()
		
	def test_clear(self):
		self.scope.clear()
		
		self.scope.screen.fill.assert_called_with((0,0,0))
		PyScope.pygame.display.update.assert_called_with()
	
	def test_show_text(self):
		glyphs = Mock()
		glyphs.get_rect.return_value = "rect"
		self.scope.font.render.return_value = glyphs
		
		self.scope.show_text("foo")
		
		self.scope.font.render.assert_called_with("foo", 1, (255,0,0))
		self.scope.screen.fill.assert_called_with((0,0,0))
		self.scope.screen.blit.assert_called_with(glyphs, "rect")
		PyScope.pygame.display.update.assert_called_with()

if __name__ == "__main__":
	unittest.main()