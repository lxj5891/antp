'use strict'

const Repo = require('ipfs-repo')
const repo = new Repo('/Users/antony/blockchain/dev/antp/.ipfs')
const Block = require('ipfs-block')
const CID = require('cids')
const multihash = require('multihashes')

const crypto = require('libp2p-crypto')
const assert = require('assert')
const waterfall = require('async/waterfall')


const Key = require('interface-datastore').Key

const mh = require('multihashes')

waterfall([
  (cb) => crypto.keys.generateKeyPair('RSA', 2048, cb),
  (privKey, cb) => privKey.public.hash((err, digest) => {
    cb(err, digest, privKey)
  })
], (err, digest, privKey) => {
  console.log(mh.toB58String(digest));
})

repo.init({my: 'config'}, (err) => {
  if (err) {
    throw err
  }
  repo.open((err, op) => {
    if (err) {
      throw err
    }
    // const buf = Buffer.from('0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33', 'hex')
    // const encoded = multihash.encode(buf, 'sha1')
    // console.log(encoded)
    // // => <Buffer 11 14 0b ee c7 b5 ea 3f 0f db c9 5d 0d d4 7f 3c 5b c2 75 da 8a 33>

    // multihash.decode(encoded)
    // console.log(multihash.toB58String());
    // // repo.set('key', {word: 'hello world !!'})

    // repo.datastore.put(new Key('awesome'), new Buffer('hello world!!!'), (err) => {
    //   if (err) {
    //     throw err
    //   }
    //   console.log('put content')
    // })

    

    // repo.datastore.get(new Key('awesome'), (err, block) => {
    //   if (err) {
    //     throw err
    //   }
    //   console.log(block);
    //   console.log('get content', block.toString())
    //   repo.close(function(err, resultClose) {
    //     console.log(err)
    //     console.log(resultClose)
    //   });
    // })
    console.log('repo is ready')
  })
});