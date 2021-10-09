const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ port: 3001 });

const MAX_USER = 2;
const users = [];

const getAnotherSocket = (me) => (
  ((users.length > 1) && users.find((user) => user !== me)) || null
);

wss.on('connection', (ws) => {
  console.log('connection');
  ws.on('message', (event) => {
    const req = JSON.parse(event);
    const type = req.type;
    const data = req.data;

    switch (type) {
      case 'join':
        if (users.length >= MAX_USER) {
          console.log('room is full');
          return;
        }
        users.push(ws);
        console.log('join user');

        if (users.length === MAX_USER) {
          ws.send(JSON.stringify({
            type: 'canOffer',
          }));
          console.log('send canOffer');
        }
        break;

      case 'offer':
        getAnotherSocket(ws).send(JSON.stringify({
          type: 'getOffer',
          data,
        }));
        console.log('send getOffer');
        break;

      case 'answer':
        getAnotherSocket(ws).send(JSON.stringify({
          type: 'getAnswer',
          data,
        }));
        console.log('send getOffer');
        break;

      case 'candidate':
        if (!getAnotherSocket(ws)) {
          return;
        }
        getAnotherSocket(ws).send(JSON.stringify({
          type: 'getCandidate',
          data,
        }));
        console.log('send getCandidate');
        break;

      default:
    }
  });
});
