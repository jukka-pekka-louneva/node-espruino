/* global require */
/* global module */

var serialPortTop = require('serialport');
var _ = require('lodash');
var S = require('string');

var that = {};

that.espruino = function(spec) {
  'use strict';

  var espruino = {
    comPort: spec.comPort,
    boardSerial: spec.boardSerial
  };

  var open = false;
  var ensureOpend = function() {
    if (!open) {
      throw 'connection must be opened before it can be used';
    }
  };

  var serialPort;
  espruino.open = function(done) {

    var openPort = function(comPort) {
      serialPort = new serialPortTop.SerialPort(comPort, {
        baudrate: 9600
      }, false); // this is the openImmediately flag [default is true]

      serialPort.open(function(err) {
        if (err) {
          throw err;
        }
        open = true;
        done();
      });
    };

    if (_.isUndefined(espruino.comPort) && _.isUndefined(espruino.boardSerial)) {
      throw 'can\'t open espruino until comPort or boardSerial is set.';
    } else if (!_.isUndefined(espruino.comPort)) {
      openPort(espruino.comPort);
    } else if (!_.isUndefined(espruino.boardSerial)) {
      throw 'not setup to support board serial yet.';
    }

  };

  var write = function(text) {
    ensureOpend();
    serialPort.write(text, function(err) {
      if (err) {
        throw err;
      }
    });
  };

  espruino.reset = function(done) {
    ensureOpend();
    espruino.command('reset()', function(result) {
      done();
    });

  };

  espruino.save = function(done) {
    ensureOpend();

    espruino.command('save()', function(result) {
      done();
    });

  };

  espruino.flash = function(text, done) {
    ensureOpend();

    espruino.reset(function() {
      espruino.command(text, function() {
        espruino.save(function() {
          done();
        });
      });
    });

  };

  espruino.command = function(command, done) {
    ensureOpend();

    if (S(command).endsWith('\n') === false) {
      command += '\n';
    }

    var completeData = '';
    var handler = function(data) {

      completeData += data;

      var isDone = function(data) {
        var regex = /^(.+)/gm;

        var matches = [];
        var match;

        while (match = regex.exec(data)) {
          matches.push(match);
        }

        var lastLine = matches[matches.length - 1][1];

        return S(lastLine).startsWith('>');
      };

      var getResult = function(data) {

        var regex = /^=(.+)/gm;

        var matches = [];
        var match;

        while (match = regex.exec(data)) {
          matches.push(match);
        }

        if (matches.length === 0) {
          return undefined;
        } else {
          return matches[matches.length - 1][1];
        }

      };

      if (isDone(completeData)) {

        var result = getResult(completeData);

        done(result);

        espruino.removeListener('data', handler);
      }

    };

    espruino.on('data', handler);
    write(command);
  };

  espruino.dump = function(done) {
    ensureOpend();

    espruino.command('dump()', done);
  };

  espruino.on = function(event, handler) {
    if (event === 'data') {
      ensureOpend();
      serialPort.on('data', handler);
    } else {
      throw 'event not supported: ' + event;
    }
  };

  espruino.removeListener = function(event, handler) {
    if (event === 'data') {
      serialPort.removeListener('data', handler);
    } else {
      throw 'event not supported: ' + event;
    }
  };

  espruino.close = function(done) {
    if (typeof serialPort !== 'undefined') {
      serialPort.close(done);
    }
  };

  return espruino;

};

// that.espruinoByBoardSerial = function(boardSerial, done) {
//   'use strict';

//   serialPortTop.list(function(err, ports) {

//     var espruino;

//     ports.forEach(function(port) {
//       if (typeof espruino === 'undefined') {

//         var foundHere = false;

//         var serialPort = new serialPortTop.SerialPort(port.comName, {
//           baudrate: 9600
//         }, false); // this is the openImmediately flag [default is true]

//         serialPort.open(function() {

//           var totalData = '';

//           setTimeout(function() {
//             if (foundHere !== true) {
//               serialPort.close();
//             }
//           }, 500);

//           var handler = function(data) {

//             totalData += data;

//             if (totalData === '="' + boardSerial + '"') {
//               foundHere = true;
//               serialPort.removeListener('data', handler);
//               // setup espruino object here.
//               // make it where we can hand in serialPort to espruino constructor.

//               var espruino = that.espruino({
//                 serialPort: serialPort
//               });

//               done(espruino);

//             }

//           };

//           serialPort.on('data', handler);

//           serialPort.write('getSerial()\n', function(err) {
//             if (err) {
//               serialPort.close();
//             }
//           });

//         });

//       }
//     });

//   });

// };

module.exports = that;