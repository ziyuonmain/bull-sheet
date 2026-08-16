#!/usr/bin/env python3
import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DIRECTORY = os.path.abspath(os.path.dirname(__file__))

class FastDevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Clean brief logging
        pass

if __name__ == '__main__':
    print(f"🚀 BullSheet Multi-Threaded Dev Server running on http://localhost:{PORT}/")
    try:
        httpd = ThreadingHTTPServer(('0.0.0.0', PORT), FastDevHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
