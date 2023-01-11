import { createServer } from 'http';
import { createReadStream } from 'fs'
import { WebSocketServer } from 'ws';

const server = createServer(async (req, res) => {
  if (req.url === '/') {
    createReadStream('./index.html').pipe(res)
  } else {
    res.write('404')
    res.end()
  }
});

const wss = new WebSocketServer({ server });


let buzzerOpen = false
let connections = []

wss.on('connection', (ws) => {
  connections.push(ws)

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString('utf-8'))

    switch (data.type) {
      case 'buzzers-open': {
        buzzerOpen = true
        for (const connection of connections) {
          connection.send(JSON.stringify({
            type: 'buzzers-open'
          }))
        }
        break
      } 
      case 'buzz': {
        if (buzzerOpen) {
          buzzerOpen = false
          for (const connection of connections) {
            connection.send(JSON.stringify({
              type: 'buzz',
              player: data.player,
            }))
          }
        }
        break
      }
    }
  });

  ws.send(JSON.stringify({
    type: 'init',
    buzzerOpen,
  }))

  ws.on('close', () => {
    connections = connections.filter(c => c !== ws)
  })
  
});

server.listen(3000);