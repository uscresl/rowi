#!/usr/bin/env python
PKG='rowi'
import roslib; roslib.load_manifest(PKG)
import rospy
import rospkg
import os
import SimpleHTTPServer
import SocketServer
import BaseHTTPServer

import os
import posixpath
import urllib

import rowi

plugins = rowi.find_plugins()

rospy.init_node('webserver')

PORT = rospy.get_param('~port',8000)
rospack = rospkg.RosPack()

wwwroot = os.path.join(rospack.get_path(PKG),'html')
os.chdir(wwwroot)

ROUTES = [
    ['', wwwroot],
]
for plugin in plugins:
    ROUTES.insert(0, ['/plugins/%s' % plugin['name'], plugin['html_path']])

config = rospy.get_param('~config',wwwroot+'/config.js')
ROUTES.insert(0, ['/config.js', config])

# http://www.huyng.com/posts/modifying-python-simplehttpserver/
class RequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    def translate_path(self, path):
        """translate path given routes"""

        # set default root to cwd
        root = os.getcwd()

        # look up routes and set root directory accordingly
        for pattern, rootdir in ROUTES:
            if path.startswith(pattern):
                # found match!
                path = path[len(pattern):]  # consume path up to pattern len
                root = rootdir
                break

        # normalize path and prepend root directory
        path = path.split('?',1)[0]
        path = path.split('#',1)[0]
        path = posixpath.normpath(urllib.unquote(path))
        words = path.split('/')
        words = filter(None, words)

        path = root
        for word in words:
            drive, word = os.path.splitdrive(word)
            head, word = os.path.split(word)
            if word in (os.curdir, os.pardir):
                continue
            path = os.path.join(path, word)

        return path

#Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
Handler = RequestHandler
class ThreadingHTTPServer(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer):
    allow_reuse_address = True

#httpd = SocketServer.TCPServer(("", PORT), Handler)
httpd = ThreadingHTTPServer(("",PORT), Handler)

httpd.timeout = 0.1
#httpd.serve_forever()
while not rospy.is_shutdown():
  httpd.handle_request()
