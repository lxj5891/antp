'use strict'

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Multiplex = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const Railing = require('libp2p-railing')
const waterfall = require('async/waterfall')
const KadDHT = require('libp2p-kad-dht')

const FsStore = require('datastore-fs')
const datastore = new FsStore('/Users/antony/.ipfs/datastore')

// Find this list at: https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/config-nodejs.json
const bootstrapers = [
  "/ip4/127.0.0.1/tcp/1337/ipfs/QmT5hJzccLd1CGhhfktd7PvRqAeiFNpSSxjdds8cPf3cNK"
]

class MyBundle extends libp2p {
  constructor (peerInfo) {
    const modules = {
      transport: [new TCP()],
      connection: {
        muxer: [Multiplex],
        crypto: [SECIO]
      },
      DHT: KadDHT,
      discovery: [new Railing(bootstrapers)]
    }
    super(modules, peerInfo, null, {
    	DHT: {
    		datastore: datastore
    	}
    })
  }
}

let node

waterfall([
  (cb) => PeerInfo.create(cb),
  (peerInfo, cb) => {
  	console.log(peerInfo.id.toB58String());
    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
    node = new MyBundle(peerInfo)
    node.start(cb)
  }
], (err) => {
  if (err) { throw err }

  node.on('peer:discovery', (peer) => {
    console.log('Discovered:', peer.id.toB58String())
    node.dial(peer, () => {})
  })

  node.on('peer:connect', (peer) => {
  	peer.multiaddrs.forEach((ma) => console.log(ma.toString()))

  	console.log("%j", peer);
  	
  	// /ipfs
  	node.peerRouting.findPeer(peer.id, (err, peer) => {
      if (err) { 
      	console.log(err);
      	return;
  	  }
      console.log('Found it, multiaddrs are:')
      peer.multiaddrs.forEach((ma) => console.log(ma.toString()))
    })
    console.log('Connection established to:', peer.id.toB58String())
  })
})
