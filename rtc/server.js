const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', function (ws) {
  clients.push(ws);

  ws.on('message', function (message) {
    // Mesajı diğer kullanıcıya ilet
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Sunucu çalışıyor http://localhost:3000');
});
