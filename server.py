from http.server import HTTPServer, CGIHTTPRequestHandler


class FlatsearchRequestHandler(CGIHTTPRequestHandler):
    def do_GET(self):
        return super().do_GET()
 
httpd = HTTPServer(('127.0.0.1', 8000), FlatsearchRequestHandler)
httpd.serve_forever()