from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit
import socket
import sys

port= 5001

app = Flask(__name__)
socketio = SocketIO(app)

def broadcast(name, value):
	emit(name, value, broadcast=True, include_self=False)

@socketio.on('connect')
def test_connect():
	print('connected')
	emit('after connect',  {'data':'Lets dance'})

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)

@socketio.on('hex')
def handle_hex(val):
	broadcast('hex', val)

@socketio.on('audio')
def handle_audio(val):
	broadcast('audio', val)

@socketio.on('pauseAudio')
def handle_pause(val):
	broadcast('pauseAudio', val)


def get_ip_address():
	"""Get the local IP address with fallback handling"""
	try:
		# Try the simple method first
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		s.connect(("8.8.8.8", 80))
		ip_address = s.getsockname()[0]
		s.close()
		return ip_address
	except:
		try:
			# Fallback method
			hostname = socket.gethostname()
			ip_addresses = socket.gethostbyname_ex(hostname)[2]
			for ip in ip_addresses:
				if not ip.startswith('127.'):
					return ip
		except:
			pass
	return None

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
	ip = get_ip_address()
	if ip:
		print(f"access at http://{ip}:{port}")
	else:
		print(f"No non-local IP found. Access may be available at http://127.0.0.1:{port}")
	socketio.run(app, host='0.0.0.0', debug=True, port=port)
