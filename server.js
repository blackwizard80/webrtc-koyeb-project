const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app); 
const io = socketIo(server);

// Cloud Host (Koyeb/Vercel) හෝ Localhost සඳහා Port 3000
const PORT = process.env.PORT || 3000; 

app.use(express.static('public'));

const STREAMER_ROOM = 'webrtc_stream_room';
let streamerId = null; // සජීවී streamer ගේ Socket ID එක ගබඩා කිරීමට

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Client එක තම භූමිකාව පැවසූ විට
    socket.on('join', (role) => {
        socket.join(STREAMER_ROOM); 

        if (role === 'streamer') {
            streamerId = socket.id;
            console.log(`Streamer joined. ID: ${streamerId}`);
            
        } else if (role === 'viewer') {
            console.log(`Viewer joined. ID: ${socket.id}`);

            // Streamer සිටී නම්, Streamer ට Offer එකක් සාදන්න කියා උපදෙස් දෙන්න
            if (streamerId && streamerId !== socket.id) {
                console.log(`Instructing streamer ${streamerId} to send new offer to viewer ${socket.id}.`);
                io.to(streamerId).emit('viewer-ready', socket.id); 
            }
        }
    });

    // Offer, Answer, ICE Candidate හුවමාරුව
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

