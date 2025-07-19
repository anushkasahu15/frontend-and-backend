const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('user-joined');
  });

  socket.on('offer', (data) => socket.to(data.room).emit('offer', data.offer));
  socket.on('answer', (data) => socket.to(data.room).emit('answer', data.answer));
  socket.on('candidate', (data) => socket.to(data.room).emit('candidate', data.candidate));
});

server.listen(3002, () => {
  console.log('Server running at http://localhost:3002');
});
