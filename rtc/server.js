const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  console.log("Yeni bir bağlantı var.");
  clients.push(ws);

  ws.on('message', (message) => {
    // Mesajı diğer kullanıcılara ilet
    console.log('Mesaj alındı: ', message);
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter((c) => c !== ws);
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Sunucu çalışıyor http://localhost:3000');
});
