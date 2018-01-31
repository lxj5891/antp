var query = require('./core/query');

query.queryPeer('0.0.0.0', 6969).then(peerInfo => {
  console.log(peerInfo);
}).catch((e) => {

})