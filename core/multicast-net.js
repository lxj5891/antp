'use strict'

const scanNet = require('./scanNet')
const EventEmitter = require('events').EventEmitter
const debug = require('debug')
const log = debug('libp2p:mdns')
const query = require('./query')

class MulticastNet extends EventEmitter {
  constructor (peerInfo, options) {
    super()
    options = options || {}
    this.port = options.port || 5353
    this.peerInfo = peerInfo
    this._queryInterval = null
  }

  start (callback) {
    console.log('multicastDNS start')
    const self = this
    const scannet = scanNet({ ip: '192.168.1', port: this.port })
    scannet.on('response', (event) => {
      console.log('%%%%%%%%%%%%%%%%%%');
      console.log(JSON.stringify(event));
      foundPeer
      self.emit('peer', foundPeer);
    })
    setImmediate(() => callback())
  }

  stop (callback) {
  }
}

module.exports = MulticastDNS