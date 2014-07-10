#!/usr/bin/env python
#
# A simple script which listens for requests to display an alert on the framebuffer
#
import os
import pygame
import sys
import time
import shutil
import logging

logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)

FONT="FreeSans"
FONT_SIZE=650
BOLD=True

class PyScope(object):
	screen = None
	scr_center = None
	font = None
	
	def __init__(self):
		"Initializes a new pygame screen using the framebuffer"
		logging.info("Initializing PyScope")
		self.init_driver()
		self.init_screen()		
		self.init_font()
		
		# Clear the screen to start
		self.screen.fill((0, 0, 0))
		# Render the screen
		pygame.display.update()
	
	def init_driver(self):
		# Based on "Python GUI in Linux frame buffer"
		# http://www.karoltomala.com/blog/?p=679
		disp_no = os.getenv("DISPLAY")
		if disp_no:
			logging.info("I'm running under X display = {0}".format(disp_no))
		
		# Check which frame buffer drivers are available
		# Start with fbcon since directfb hangs with composite output
		drivers = ['fbcon', 'directfb', 'svgalib', 'x11']
		found = False
		logging.info("Looking for suitable SDL driver")
		for driver in drivers:
			# Make sure that SDL_VIDEODRIVER is set
			if not os.getenv('SDL_VIDEODRIVER'):
				os.putenv('SDL_VIDEODRIVER', driver)
			logging.info("Trying " + driver)
			try:
				pygame.display.init()
			except pygame.error:
				logging.info('Driver: {0} failed.'.format(driver))
				continue
			found = True
			break
	
		if not found:
			raise Exception('No suitable video driver found!')
		logging.info("Using %s for display" % pygame.display.get_driver())
		
	def init_screen(self):
		size = (pygame.display.Info().current_w, pygame.display.Info().current_h)
		logging.info("Framebuffer size: " + str(size[0]) + " x " + str(size[1]))
		self.screen = pygame.display.set_mode(size, pygame.FULLSCREEN)
		self.scr_center = self.screen.get_rect().center
		# Hide the mouse cursor
		pygame.mouse.set_visible(False)

	def init_font(self):
		""" Initialise font support """
		pygame.font.init()
		self.font = pygame.font.SysFont(FONT, FONT_SIZE, bold=BOLD)

	def __del__(self):
		"Destructor to make sure pygame shuts down, etc."

	def clear(self):
		self.screen.fill((0,0,0))
		pygame.display.update()

	def show_text(self, text, color=(255,0,0)):
		glyphs = self.font.render(text, 1, color)
		self.screen.fill((0,0,0))
		self.screen.blit(glyphs, glyphs.get_rect(center=self.scr_center))
		pygame.display.update()
