const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Host creates a room
  socket.on("create_room", (code) => {
    socket.join(code);
    rooms[code] = { host: socket.id, survivor: null };
    console.log(`Relay Room Created: ${code}`);
  });

  // Survivor joins a room
  socket.on("join_room", (code) => {
    if (rooms[code]) {
      rooms[code].survivor = socket.id;
      socket.join(code);
      // Notify host that the tunnel is open
      io.to(rooms[code].host).emit("survivor_joined", socket.id);
      console.log(`Survivor ${socket.id} joined Room ${code}`);
    }
  });

  // THE RELAY PIPE: Forwards any data to the other person in the room
  socket.on("relay_data", (data) => {
    const roomCode = Array.from(socket.rooms)[1];
    if (roomCode) {
      socket.to(roomCode).emit("receive_data", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Railway uses process.env.PORT
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay Server active on port ${PORT}`);
});