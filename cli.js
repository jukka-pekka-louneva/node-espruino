/* global require */
/* global console */
/* global process */

'use strict';

var program = require("commander")
	.version("0.2.7")
	.usage('<command> <file> [options]')
	.option("-d, --debug <n>", "Debug level", parseInt)
	.option("-b, --boardserial [value]", "Connect to board serial id")
	.option("-p, --port [value]", "Connect to serial port")
	.option("-l, --listen", "Listen to serial connection")
	.parse(process.argv);

var command = program.rawArgs[2];
var file = program.rawArgs[3];
var debug = program.debug || 0;
var boardSerial = program.boardserial;
var port = program.port;
var save = !!program.save;
var listen = !!program.listen;

var throwError = function(err, showHelp) {
	console.error('\n  Error:', err);
	if (showHelp) {
		program.help();
	} else {
		process.exit(1);
	}
};

if (!file) throwError('File must be specified!', true);
if (!command) throwError('Command must be specified!', true);

// Modules
var nodeEspruino = require('./node-espruino.js');
var readline = require('readline');
var serialPort = require('serialport');
var fs = require('fs');

var runCommand = function(espruino) {
	if (command === 'upload') {
		espruino.open(function(err) {
			if (err) {
				espruino.close();
				throwError(err);
			}

			var content = fs.readFileSync(file, 'utf8');

			console.log('uploading...');

			var handler = function(data) {
				if (debug > 0) {
					process.stdout.write(data);
				}
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
		throwError('command does not exist: ' + command);
	}
};

if (typeof port !== 'undefined') {
	console.log('connecting to ' + port);
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