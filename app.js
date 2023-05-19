const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 443;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));



// SSL certificate options
const options = {
    key: fs.readFileSync('sslcert/server.key', 'utf8'),
    cert: fs.readFileSync('sslcert/server.crt', 'utf8')
};

// Start the HTTPS server
https.createServer(options, app).listen(port, () => {
    console.log(`Server is running https://localhost/ on port ${port}`);
});