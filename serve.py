"""带 Cache-Control 头的 HTTP 静态服务器，用于本地开发。"""
import http.server
import socketserver
import os

PORT = 8080

class CacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path
        if path.endswith('.html') or path.endswith('.js') or path.endswith('.css') or path == '/':
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)) if not os.getcwd().endswith('Travel_project') else os.getcwd())
    print(f'Serving on http://127.0.0.1:{PORT}')
    with socketserver.TCPServer(('127.0.0.1', PORT), CacheHandler) as httpd:
        httpd.serve_forever()
