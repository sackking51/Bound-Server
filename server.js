const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

io.on("connection", (socket) => {
    // 1. Host creates room
    socket.on("create_room", (code) => {
        socket.join(code);
        rooms[code] = { host: socket.id };
        console.log(`Room [${code}] Created by ${socket.id}`);
    });

    // 2. Survivor joins room
    socket.on("join_room", (code) => {
        if (rooms[code]) {
            socket.join(code);
            // Tell the host the survivor is here
            io.to(rooms[code].host).emit("survivor_joined", socket.id);
            // Tell the survivor they successfully joined
            socket.emit("joined_status", "SUCCESS");
            console.log(`Survivor ${socket.id} joined Room [${code}]`);
        } else {
            socket.emit("joined_status", "FAILED");
        }
    });

    // 3. THE DATA PIPE (The "Replication" logic)
    socket.on("relay_data", (data) => {
        const roomCode = Array.from(socket.rooms)[1];
        if (roomCode) {
            socket.to(roomCode).emit("receive_data", data);
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Matchmaker live on port ${PORT}`);
});