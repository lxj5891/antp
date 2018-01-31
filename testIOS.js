var idevice = require('idevice-browser');

idevice.start();

setInterval(function() { 
    var lastSeen = new Date();
        lastSeen.setTime(lastSeen.getTime() - 3600000);

    console.log(idevice.getDevices(lastSeen));
}, 5000);