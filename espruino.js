

/* global require */
/* global console */
/* global process */

'use strict';

//espruino deploy script.js
var nodeEspruino = require('./node-espruino.js');
var readline = require('readline');
var serialPort = require('serialport');
var _ = require('lodash');
var fs = require('fs');

var args = require('minimist')(process.argv.slice(2));
//console.log(argv);

var command = args._[0];
var port = args.port;
var id = args.id;

var runCommand = function() {
	console.log('connecting to serial ' + port);

	var espruino = nodeEspruino.espruino({
		serialport: port
	});


	if (command === 'deploy') {
		espruino.open(function() {
			var file = args._[1];

			var content = fs.readFileSync(file, 'utf8');

			espruino.write('reset() \n ' + content + ' \n save() \n');
			espruino.close();
		});
	} else {
		throw 'command does not exist: ' + command;
	}
};

if (typeof port !== 'undefined') {
	runCommand();
} else if (typeof id !== 'undefined') {
	serialPort.list(function(err, ports) {

		var found = _.find(ports, function(port) {
			return port.pnpId === id;
		});

		if (typeof found === 'undefined') {
			console.error('Coudlnt find a conneced serial port with the plugin play id of ' + id);
			process.exit(1);
		}

		port = found.comName;
		runCommand();

	});
} else {

	console.log('Enter the serial port that the espruino is connected to.');
	console.log('Availible ports:');

	serialPort.list(function(err, ports) {

		ports.forEach(function(port) {
			console.log('Name: ' + port.comName + ', pnpId: ' + port.pnpId);
		});

		var rl = readline.createInterface(process.stdin, process.stdout);
		rl.setPrompt('port> ');
		rl.prompt();
		rl.on('line', function(input) {
			// if (line === 'right') rl.close();
			// rl.prompt();
			port = input;
			rl.close();
			runCommand();
		});

	});

}