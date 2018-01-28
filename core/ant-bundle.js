'use strict'

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Multiplex = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')
const Railing = require('libp2p-railing')
const PeerInfo = require('peer-info')

const bootstrapers = [
  "/ip4/127.0.0.1/tcp/1337",
]

class AntBundle extends libp2p {
  constructor (peerInfo) {
    const modules = {
      transport: [new TCP()],
      connection: {
        muxer: [Multiplex],
        crypto: [SECIO]
      },
      discovery: [new Railing(bootstrapers)]
    }
    super(modules, peerInfo)
  }
}

module.exports = AntBundle