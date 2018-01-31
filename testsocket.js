var net = require('net')
var async = require('async');
var exec = require('child_process').exec;
var Socket = net.Socket
//待扫描的开始网段，可换成192.168.0
var ip = '192.168.199'
// var port = 80
var scan = function (host, port, cb) {
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
var pingTongIps = [];
var found = [];
// ips = [ '192.168.199.221', '192.168.199.230', '192.168.199.255' ]
async.each(ips, function (itemPing, cbPing) {
  exec("ping -c 2 "+ itemPing +" -t 1", function (err, stdout, stderr) {
    if(err) {};
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
      scan(item, itemPort, function (err, host) {
        try {
          if (err) {
            // console.log('Not found host: ' + item + 'post: ' + itemPort)
            return cbPort(null);
          }
          console.log("Found: host:" + item + " post: " + itemPort)
          found.push("Found: host:" + item + " post: " + itemPort);
          cbPort();
        } catch(e) {

        }
      })
    }, function (err) {
      cb();
    });
  }, function (err) {
    console.log(found);
  });
});
