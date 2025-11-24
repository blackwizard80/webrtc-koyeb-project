const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app); 

// Socket.IO සේවාදායකය ආරම්භ කිරීම
const io = socketIo(server);

// Koyeb වැනි Cloud host එකකදී Port එක process.env.PORT මඟින් ලබා ගනී
const PORT = process.env.PORT || 3000; 

// Public ෆෝල්ඩරයේ ඇති HTML ගොනු පූරණය කිරීම
app.use(express.static('public'));

// සේවාදායකයා සම්බන්ධ වූ විට
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Offer, Answer, ICE Candidate හුවමාරුව
    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', { sdp: data.sdp, id: data.id });
    });

    socket.on('answer', (data) => {
        socket.broadcast.emit('answer', { sdp: data.sdp, id: data.id });
    });

    socket.on('ice-candidate', (data) => {
        socket.broadcast.emit('ice-candidate', { candidate: data.candidate, id: data.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
