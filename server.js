const http = require('http');
const server = http.createServer();
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;
const rooms = {};

io.on('connection', (socket) => {
    // Correct IP extraction for Socket.io 2.x + Railway
    const clientIP = socket.handshake.headers['x-forwarded-for'] || 
                     socket.request.connection.remoteAddress.replace('::ffff:', '');
    
    console.log(`Connected: ${clientIP}`);

    socket.on('host-room', (code) => {
        rooms[code] = clientIP;
        socket.join(code);
        console.log(`Room [${code}] hosted at ${clientIP}`);
    });

    socket.on('join-room', (code) => {
        let hostIP = rooms[code];
        if (hostIP) {
            // Loopback fix for same-machine testing
            if (hostIP === clientIP) {
                hostIP = "127.0.0.1";
            }
            socket.emit('join-success', hostIP);
            console.log(`Join [${code}]: Sent IP ${hostIP}`);
        }
    });
});

// IMPORTANT: Listen on 0.0.0.0 so Railway can find the app
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Relay v2.3.0 listening on port ${PORT}`);
});