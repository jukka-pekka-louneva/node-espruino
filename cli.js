/* global require */
/* global console */
/* global process */

'use strict';

var nodeEspruino = require('./node-espruino.js');
var readline = require('readline');
var serialPort = require('serialport');
var _ = require('lodash');
var fs = require('fs');

var args = require('minimist')(process.argv.slice(2));
//console.log(argv);

var command = args._[0];

if (typeof command === 'undefined') {
	console.error('command must be specified');
	process.exit(1);
}

var port = args.port;
var boardSerial = args.boardserial;
var listen = args.listen;

var runCommand = function(espruino) {

	if (command === 'upload') {
		espruino.open(function(err) {

			var save = !! args.save;

			if (err) {
				espruino.close();
				console.error(err);
				process.exit(1);
			}

			var file = args._[1];
			var content = fs.readFileSync(file, 'utf8');

			console.log('begining upload.');

			var handler = function(data) {
				process.stdout.write(data);
			};

			var opts = {
				save: save,
				uploadModules: true
			};

			espruino.on('data', handler);
			espruino.upload(content, opts, function() {
				console.log('success!');

				if (listen === true) {
					// were going to leave the serial connection open, so that the user can watch the 
					// response from the board. 
				} else {
					espruino.removeListener('data', handler);
					espruino.close();
				}

			});

		});
	} else {
		espruino.close();

		console.error('command does not exist: ' + command);
		process.exit(1);
	}
};

if (typeof port !== 'undefined') {
	console.log('connecting to COM ' + port);
	runCommand(nodeEspruino.espruino({
		comPort: port
	}));
} else if (typeof boardSerial !== 'undefined') {
	console.log('connecting to board with serial ' + boardSerial);
	runCommand(nodeEspruino.espruino({
		boardSerial: boardSerial
	}));
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
			var espruino = nodeEspruino.espruino({
				comPort: input
			});

			rl.close();
			runCommand(espruino);
		});

	});

}