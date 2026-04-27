const app = require('http').createServer();
const io = require('socket.io')(app, {
    // Version 2 uses a different CORS syntax
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

const PORT = process.env.PORT || 3000;
const rooms = {};

io.on('connection', (socket) => {
    // IP extraction for Socket.io 2.x
    const clientIP = socket.handshake.headers['x-forwarded-for'] || 
                     socket.request.connection.remoteAddress.replace('::ffff:', '');
    
    console.log(`Connected: ${clientIP}`);

    socket.on('host-room', (code) => {
        rooms[code] = clientIP;
        socket.join(code);
        console.log(`Room [${code}] hosted at ${clientIP}`);
    });

    socket.on('join-room', (code) => {
        const hostIP = rooms[code];
        if (hostIP) {
            console.log(`Found Room [${code}]. Directing to ${hostIP}`);
            socket.emit('join-success', hostIP);
        } else {
            socket.emit('error', 'Room not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`v2.3.0 Relay running on port ${PORT}`);
});