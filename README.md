# Nursery Alert System

This is made up of three separate parts:
* A user interface, written in JavaScript and HTML. It uses AJAX to communicate with...
* An alert manager back-end, written with Node.js. It manages the queue of alerts, and
  makes sure each alert is displayed appropriately, then expired properly. It exposes a
  RESTful API, and at the bottom uses simple HTTP requests to communicate with...
* A displayer, written in Python, which simply listens for requests 
  to either display a 3-character alert to the screen, or clear the screen.
