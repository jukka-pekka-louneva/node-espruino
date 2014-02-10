var nodeEspruino = require('./node-espruino.js');

var espruino = nodeEspruino.espruino({
	serialport: 'COM4'
});

espruino.open(function() {
	'use strict';

	espruino.on('data', function(data) {
		console.log('Data recieved: ' + data);
		espruino.close();
	});

	espruino.write('1+2\n');
});