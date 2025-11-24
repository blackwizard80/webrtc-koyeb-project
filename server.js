const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app); 
// ** Socket.IO Configuration (Path එක නිවැරදි කිරීම) **
const io = socketIo(server, {
    path: '/socket.io/', // Koyeb හෝ Reverse Proxy සඳහා අවශ්‍යයි
    transports: ['websocket', 'polling'] // සන්නිවේදනය ස්ථාවරව තබා ගැනීමට
});

const PORT = process.env.PORT || 3000; 

app.use(express.static('public'));

const STREAMER_ROOM = 'webrtc_stream_room';
let streamerId = null; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (role) => {
        socket.join(STREAMER_ROOM); 

        if (role === 'streamer') {
            streamerId = socket.id;
            console.log(`Streamer joined. ID: ${streamerId}`);
            
        } else if (role === 'viewer') {
            console.log(`Viewer joined. ID: ${socket.id}`);

            if (streamerId && streamerId !== socket.id) {
                console.log(`Instructing streamer ${streamerId} to send new offer to viewer ${socket.id}.`);
                io.to(streamerId).emit('viewer-ready', socket.id); 
            }
        }
    });

    socket.on('offer', (data) => {
        socket.to(STREAMER_ROOM).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(STREAMER_ROOM).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(STREAMER_ROOM).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.id === streamerId) {
            streamerId = null;
            console.log('Streamer disconnected. Waiting for new streamer.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
