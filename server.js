// Railway provides the PORT environment variable automatically
const PORT = process.env.PORT || 3000;

// Initialize socket.io with the specific v4 version
const io = require('socket.io')(PORT, {
    cors: {
        origin: "*", // Allows your Unreal client to connect from anywhere
        methods: ["GET", "POST"]
    },
    allowEIO3: true // Backwards compatibility just in case
});

// Our global storage for room codes and IPs
const rooms = {}; 

io.on('connection', (socket) => {
    // Railway's proxy usually puts the user's real IP in 'x-forwarded-for'
    const clientIP = socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.address.replace('::ffff:', '');
    
    console.log(`Connection established: ${clientIP}`);

    // --- HOSTING ---
    socket.on('host-room', (code) => {
        rooms[code] = clientIP;
        socket.join(code);
        console.log(`Lobby [${code}] created by Host: ${clientIP}`);
    });

    // --- JOINING ---
    socket.on('join-room', (code) => {
        const targetIP = rooms[code];
        
        if (targetIP) {
            console.log(`Survivor found room [${code}]. Sending them to Host: ${targetIP}`);
            // This is the "42" message your Unreal C++ is listening for
            socket.emit('join-success', targetIP);
        } else {
            console.log(`Join attempt failed: Room [${code}] is empty or expired.`);
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('disconnect', () => {
        // We keep the room active for a bit so players can reconnect if needed
        console.log(`Client ${socket.id} disconnected.`);
    });
});

console.log(`Bound Relay Server is LIVE on port ${PORT}`);