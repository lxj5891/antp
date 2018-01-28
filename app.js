const waterfall = require('async/waterfall')
const PeerInfo = require('peer-info')
const AntBundle = require('./core/ant-bundle');
const async = require('async');
const pull = require('pull-stream')

function createNode (callback) {
  let node

  waterfall([
    (cb) => PeerInfo.create(cb),
    (peerInfo, cb) => {
      peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
      node = new AntBundle(peerInfo)
      node.start(cb)
    }
  ], (err) => callback(err, node))
}

function printAddrs (node, number) {
  console.log('node %s is listening on:', number)
  node.peerInfo.multiaddrs.forEach((ma) => console.log(ma.toString()))
}

async.parallel([
  (cb) => createNode(cb),
  (cb) => createNode(cb)
], (err, nodes) => {
  if (err) { throw err }

  const node1 = nodes[0]
  const node2 = nodes[1]

  printAddrs(node1, '1')
  printAddrs(node2, '2')

  node1.on('peer:discovery', (peer) => {
    console.log('Discovered:', peer.id.toB58String())
    node1.dial(peer, () => {})
  });

  node1.on('peer:connect', (peer) => {
  	node1.ping(peer ,function(err, resultPing) {
  		if (err) {
  			console.error(err);
  			return;	
  		}
  		console.log(resultPing);
  	});
    console.log('Node1 Connection established to:', peer.id.toB58String())
  });

  node2.on('peer:connect', (peer) => {
  	node2.ping(peer ,function(err, resultPing) {
  		if (err) {
  			console.error(err);
  			return;	
  		}
  		
  		console.log(resultPing);
  	});
    console.log('Node2 Connection established to:', peer.id.toB58String())
  });

  node2.handle('/handle1', (protocol, conn) => {
    pull(
      conn,
      pull.map((v) => v.toString()),
      pull.log()
    )
  })

  node2.handle('/handle2', (protocol, conn) => {
  	console.log('node 2  handle 2 message:', protocol)
  	pull(
      conn,
      pull.map((v) => v.toString()),
      pull.log()
    )
  	setTimeout(function(){
  		node2.dial(node1.peerInfo, '/handle2', (err, dialConn) => {
		if (err) { throw err }
			pull(pull.values(['Hello', ' ', 'p2p', ' ', 'world', 'this is node 2']), dialConn)
		});
  	}, 1);
  });

  node1.handle('/handle2', (protocol, conn) => {
  	console.log('node 1  handle 2 message:', protocol)
  	pull(
      conn,
      pull.map((v) => v.toString()),
      pull.log()
    )
    setTimeout(function() {
    	node1.dial(node2.peerInfo, '/handle2', (err, dialConn) => {
		if (err) { throw err }
			pull(pull.values(['Hello', ' ', 'p2p', ' ', 'world', 'this is node 1']), dialConn)
		});
  	}, 1);
  })

  node1.dial(node2.peerInfo, '/handle2', (err, conn) => {
    if (err) { throw err }
    console.log('conn: %j', conn);
    pull(pull.values(['Hello', ' ', 'p2p', ' ', 'world', '!']), conn)
  });
});
