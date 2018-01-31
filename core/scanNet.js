var packet = require('dns-packet')
var dgram = require('dgram')
var thunky = require('thunky')
var events = require('events')
var net = require('net');
var async = require('async');
var os = require('os')
var query = require('./query');
var noop = function () { }

var scanLoop = function (host, port, cb) {
  var socket = new Socket()
  var status = null
  socket.setTimeout(200)
  socket.on('connect', function () {
    socket.end()
    cb && cb(null, host)
  })
  socket.on('timeout', function () {
    socket.destroy()
    cb && cb(new Error('timeout'), host)
  })
  socket.on('error', function (err) {
    cb && cb(err, host)
  })
  socket.on('close', function (err) {
  })
  socket.connect(port, host)
}

module.exports = function (opts) {
  if (!opts) opts = {}
  var that = new events.EventEmitter()
  var ip = opts.ip
  var peerInfo = peerInfo
  var pingTongIps = [];
  const startNameService = () => {
    var PORT = 6969;
    // 创建一个TCP服务器实例，调用listen函数开始监听指定端口
    // 传入net.createServer()的回调函数将作为”connection“事件的处理函数
    // 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
    net.createServer(function (sock) {
      // 我们获得一个连接 - 该连接自动关联一个socket对象
      console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
      // 为这个socket实例添加一个"data"事件处理函数
      sock.on('data', function (data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        sock.write('You said "' + data + '"');
      });
      // 为这个socket实例添加一个"close"事件处理函数
      sock.on('close', function (data) {
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
      });

    }).listen(PORT);
  }
  
  const createScan = () => {
    var ips = [];
    var ports = [];
    for (var i = 1; i <= 255; i++) {
      ips.push(ip + '.' + i)

    }
    for (var j = 1; j < 1000; j++) {
      ports.push(j)
    }
    // console.log(ips);
    console.log(ports);
    // ips = [ '192.168.199.221', '192.168.199.230', '192.168.199.255' ]
    async.each(ips, function (itemPing, cbPing) {
      exec("ping -c 2 " + itemPing + " -t 1", function (err, stdout, stderr) {
        if (err) { };
        console.log(stdout);
        console.log(stderr);
        if (!stderr && stdout.indexOf('icmp_seq=0') !== -1) {
          pingTongIps.push(itemPing)
        }
        cbPing();
      });
    }, function (err) {
      console.log(pingTongIps);
      async.eachSeries(pingTongIps, function (item, cb) {
        async.eachSeries(ports, function (itemPort, cbPort) {
          scanLoop(item, itemPort, function (err, host) {
            try {
              if (err) {
                return cbPort(null);
              }
              query.queryPeer(item, itemPort).then(peerInfo => {
                if (peerInfo && peerInfo.peerId) {
                  that.emit('response', { host: item, port: port, peerId: peerInfo.peerId })
                }
                cbPort();
              }).catch((e) => {
                cbPort();
              })
            } catch (e) {

            }
          });
        }, function (err) {
          cb();
        });
      }, function (err) {
        pingTongIps = [];
        createScan();
      });
    });
  }
  return that
}
