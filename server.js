const app = require('http').createServer();
const io = require('socket.io')(app);
const PORT = process.env.PORT || 3000;
const rooms = {};

io.on('connection', (socket) => {
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
            // LOOPBACK FIX: If testing on one machine, '127.0.0.1' is safer than the Public IP
            if (hostIP === clientIP) {
                console.log("Loopback detected (Same Network). Sending 127.0.0.1");
                hostIP = "127.0.0.1";
            }
            socket.emit('join-success', hostIP);
        }
    });
});

app.listen(PORT, () => console.log(`v2.3.0 Relay running on port ${PORT}`));