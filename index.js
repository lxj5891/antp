'use strict'

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WS = require('libp2p-websockets')
const Multiplex = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const MulticastDNS = require('libp2p-mdns')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const Pushable = require('pull-pushable')
const pull = require('pull-stream')

console.log(process.argv);
const portIndex = process.argv.indexOf('-p');
const port = process.argv[portIndex + 1];
const masterIndex = process.argv.indexOf('-m');
const isMaster = process.argv[masterIndex + 1];
const nickIndex = process.argv.indexOf('-n');
const nick = process.argv[nickIndex + 1];
console.log('port:', port)

class MyBundle extends libp2p {
  constructor(peerInfo) {
    const modules = {
      transport: [
        new TCP(),
        new WS()
      ],
      connection: {
        muxer: [Multiplex],
        crypto: [SECIO]
      },
      discovery: [new MulticastDNS(peerInfo, { interval: 5000 })]
    }
    super(modules, peerInfo)
  }
}

function createNode(callback) {
  let node

  waterfall([
    (cb) => PeerInfo.create(cb),
    (peerInfo, cb) => {
      peerInfo.multiaddrs.add(`/ip4/0.0.0.0/tcp/${port}`);
      node = new MyBundle(peerInfo)
      node.start(cb)
    }
  ], (err) => callback(err, node))
}

let myName = ''
let myPeerId = '';
let stdin = null;
const nameList = {

}
const peerConnSet = {

}

let tmpChunk = '';
const execCommond = (action, params) => {
  if ((/start/).test(tmpChunk)) {
    start();
    return;
  }
  if ((/message/).test(tmpChunk)) {
    message(tmpChunk)
    return;
  }
  if ((/all/).test(tmpChunk)) {
    messageAll(tmpChunk)
    return;
  }
  if ((/nameList/).test(tmpChunk)) {
    console.log(nameList);
    return;
  }
  if ((/peerList/).test(tmpChunk)) {
    console.log(peerConnSet);
    return;
  }
  if ((/endone/).test(tmpChunk)) {
    endOne(tmpChunk);
    return;
  }
  if ((/endall/).test(tmpChunk)) {
    endAll(tmpChunk);
    return;
  }
}
const endOne = (command) => {
  var commandList = command.split(' ');
  if (commandList.length < 2) {
    return;
  }
  const nick = commandList[1];
  const peerId = nameList[nick];
  const p = peerConnSet[peerId].p;
  p.end();
  delete nameList[nick]
  delete peerConnSet[peerId];
}

const endAll = () => {
  for (var i in nameList)  {
    const peerId = nameList[i];
    const p = peerConnSet[peerId].p;
    p.end();
    delete nameList[i]
    delete peerConnSet[peerId];
  }
}

const updateChunkCommend = (chunk) => {
  if (chunk.indexOf('\n') !== -1) {
    tmpChunk = tmpChunk + chunk;
    execCommond(tmpChunk);
    tmpChunk = ''
  } else {
    tmpChunk = tmpChunk + chunk;
  }
}

process.stdin.setEncoding('utf8')
process.openStdin().on('data', (chunk) => {
  updateChunkCommend(chunk.toString());
});

function messageAll(command) {
  var commandList = command.split(' ');
  if (commandList.length < 2) {
    return;
  }
  const msg = commandList[1];
  for (var i in nameList)  {
    const peerId = nameList[i];
    const p = peerConnSet[peerId].p;
    p.push(msg);
  }
}

function message(command) {
  var commandList = command.split(' ');
  if (commandList.length < 3) {
    return;
  }
  const nick = commandList[1];
  const msg = commandList[2];
  const peerId = nameList[nick];
  const peerInfo = peerConnSet[peerId].peerInfo;
  const p = peerConnSet[peerId].p;
  p.push(msg)
}

function start() {
  waterfall([
    (cb) => {
      myName = nick
      cb(null, myName)
    },
    (myName, cb) => createNode(cb)
  ], (err, node) => {
    if (err) { throw err }
    myPeerId = node.peerInfo.id.toB58String()
    console.log(myPeerId);

    node.swarm.on('peer-mux-established', (peerInfo) => {
      console.log(peerInfo.id.toB58String())
    })

    node.peerInfo.multiaddrs.forEach((ma) => {
      console.log(ma.toString())
    })

    node.handle('/hello', (protocol, conn) => {
      console.log('conn : ', JSON.stringify(conn));
      pull(
        conn,
        pull.map((data) => {
          return data.toString('utf8').replace('\n', '')
        }),
        pull.drain(function(data) {
          const namespace = data.split(',');
          const clientNick = namespace[0];
          const clientPeerId = namespace[1];
          console.log('clientNick:', clientNick)
          console.log('clientPeerId:', clientPeerId)
          nameList[clientNick] = clientPeerId;
          node.dial(peerConnSet[clientPeerId].peerInfo, '/chat', (err, conn) => {
            if (err) {
              throw err
            }
            
            const p = Pushable()
            // Write operation. Data sent as a buffer
            pull(
              p,
              conn
            )
            // Sink, data converted from buffer to utf8 string
            pull(
              conn,
              pull.map((data) => {
                return data.toString('utf8').replace('\n', '')
              }),
              pull.drain(console.log)
            )
            peerConnSet[clientPeerId].p = p;
          });
        })
      )
    });

    node.handle('/chat', (protocol, conn) => {
      const p = Pushable();

      pull(
        p,
        conn
      )

      pull(
        conn,
        pull.map((data) => {
          return data.toString('utf8').replace('\n', '')
        }),
        pull.drain(console.log)
      )
    });


    node.on('peer:connect', (peer) => {
      console.log('Connection established to:', peer.id.toB58String())
      peerConnSet[peer.id.toB58String()].peerInfo = peer;
    })

    node.on('peer:disconnect', (peer) => {
      console.log('disconnect : ', peer.id.toB58String());
      delete peerConnSet[peer.id.toB58String()];
    })

    node.on('peer:discovery', (peer) => {
      if (peerConnSet[peer.id.toB58String()]) {
        return;
      }
      console.log('Discovered:', peer.id.toB58String())
      peerConnSet[peer.id.toB58String()] = {
        nick: '',
        peerInfo: null
      }
      console.log()
      node.dial(peer, '/hello', (err, conn) => {
        if (err) {
          console.log(err)
          return;
        }
        pull(pull.values([`${nick},${myPeerId}`]), conn)
      })
    })
  })

}

