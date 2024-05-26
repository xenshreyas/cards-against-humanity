from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, send, emit

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for simplicity
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins for SocketIO

@socketio.on('create_room')
def on_create_room(data):
    room = data['room']
    join_room(room)
    emit('room_created', {'room': room}, room=room)

@socketio.on('join_room')
def on_join_room(data):
    room = data['room']
    join_room(room)
    emit('room_joined', {'room': room}, room=room)

@socketio.on('leave_room')
def on_leave_room(data):
    room = data['room']
    leave_room(room)
    emit('room_left', {'room': room}, room=room)

@socketio.on('send_message')
def on_send_message(data):
    print("message received!")
    room = data['room']
    message = data['message']
    emit('receive_message', message, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)
