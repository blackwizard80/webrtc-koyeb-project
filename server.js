const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app); 
const io = socketIo(server, {
    path: '/socket.io/', // Koyeb Reverse Proxy සඳහා
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000; 

app.use(express.static('public'));

const STREAMER_ROOM = 'webrtc_stream_room';
let streamerId = null; 
// Viewer ගේ ID තබා ගැනීම
const viewers = {}; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (role) => {
        if (role === 'streamer') {
            streamerId = socket.id;
            socket.join(STREAMER_ROOM);
            console.log(`Streamer joined. ID: ${streamerId}`);
            
        } else if (role === 'viewer') {
            viewers[socket.id] = true;
            console.log(`Viewer joined. ID: ${socket.id}`);
            
            if (streamerId && streamerId !== socket.id) {
                // Streamer හට මෙම Viewer ට පමණක් Offer එක යවන්නට උපදෙස් දෙන්න
                io.to(streamerId).emit('viewer-ready', socket.id); 
            }
        }
    });

    // Offer එක යවන්නේ විශේෂිත Viewer කෙනෙකුටයි
    socket.on('offer', (data) => {
        // data.targetId යනු offer එක ලැබිය යුතු Viewer ගේ ID
        if (data.targetId) {
            // TargetId එකට Offer එක යවන්න
            io.to(data.targetId).emit('offer', { sdp: data.sdp, fromId: socket.id });
        }
    });

    // Answer එක යවන්නේ Streamer හට පමණයි
    socket.on('answer', (data) => {
        if (streamerId) {
            io.to(streamerId).emit('answer', { sdp: data.sdp, fromId: socket.id });
        }
    });

    // ICE Candidate යවන්නේ නිශ්චිත ග්‍රාහකයාටයි
    socket.on('ice-candidate', (data) => {
        // Streamer ICE එකක් යවන්නේ නම්, එය යැවිය යුත්තේ Offer එක එව්ව Viewer හට
        if (socket.id === streamerId && data.targetId) {
            io.to(data.targetId).emit('ice-candidate', data);
        }
        // Viewer ICE එකක් යවන්නේ නම්, එය යැවිය යුත්තේ Streamer හට
        else if (socket.id !== streamerId && streamerId) {
            io.to(streamerId).emit('ice-candidate', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete viewers[socket.id];
        if (socket.id === streamerId) {
            streamerId = null;
            console.log('Streamer disconnected. Waiting for new streamer.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
