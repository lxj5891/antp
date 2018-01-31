'use strict'

var net = require('net')
var Socket = net.Socket;
module.exports = {
  queryPeer: function (host, port, callback) {
    return new Promise((resolve, reject) => {
      var flagResult = false;
      var socket = new Socket()
      socket.setTimeout(2000)
      socket.on('connect', function () {
        socket.write('WHOIS');
      })
      socket.on('timeout', function () {
        if (!flagResult) reject();
      })
      socket.on('error', function (err) {
        if (!flagResult) reject();
      })
      socket.on('close', function (err) {
        if (!flagResult) reject();
      })
      socket.on('data', function (thunk) {
        var data = thunk.toString();
        flagResult = true
        if (data && data.split(':').length === 2) {
          var sData = data.split(':');
          resolve({ peerId: sData[1] });
        } else {
          reject({ msg: 'no peer' });
        }
      })
      socket.connect(6969, '0.0.0.0');
    });
  },
}
