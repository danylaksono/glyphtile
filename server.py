#!/usr/bin/env python3
"""
Simple HTTP server for the ScreenGrid library examples.
Run with: python3 server.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def guess_type(self, path):
        # Ensure proper MIME types for JavaScript modules
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

def main():
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"ScreenGrid Library Server")
        print(f"=======================")
        print(f"Server running at http://localhost:{PORT}")
        print(f"")
        print(f"Available examples:")
        print(f"  Main demo:     http://localhost:{PORT}/index.html")
        print(f"  Simple test:   http://localhost:{PORT}/test.html")
        print(f"  Basic example: http://localhost:{PORT}/example.js")
        print(f"")
        print(f"Press Ctrl+C to stop the server")
        print(f"")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/index.html')
            print("Opening browser...")
        except:
            print("Could not open browser automatically")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
