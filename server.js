const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" } // Allows connections from your HTML5 build
});

// This object stores active rooms: { "RoomCode": "HostIP" }
const activeRooms = {};

io.on("connection", (socket) => {
  const userIP = socket.handshake.address.replace('::ffff:', '');
  console.log(`User connected: ${socket.id} from ${userIP}`);

  // --- HOST LOGIC ---
  socket.on("host_room", (roomCode) => {
    activeRooms[roomCode] = userIP;
    socket.join(roomCode);
    console.log(`Room [${roomCode}] created by Host at ${userIP}`);
    socket.emit("status", "Room registered successfully.");
  });

  // --- JOINER LOGIC ---
  socket.on("find_room", (roomCode) => {
    const targetIP = activeRooms[roomCode];

    if (targetIP) {
      console.log(`Survivor ${socket.id} found Room [${roomCode}]. Sending IP: ${targetIP}`);
      // Send the IP back to the survivor so Unreal can "Open" it
      socket.emit("receive_ip", targetIP); 
    } else {
      socket.emit("status", "Room not found. Check your code!");
    }
  });

  // Cleanup when host leaves
  socket.on("disconnect", () => {
    for (const code in activeRooms) {
      if (activeRooms[code] === userIP) {
        delete activeRooms[code];
        console.log(`Room [${code}] closed because host disconnected.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Bound Matchmaker running on port ${PORT}`);
});