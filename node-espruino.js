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

    if (_.isUndefined(espruino.comPort) && _.isUndefined(espruino.boardSerial)) {
      throw 'can\'t open espruino until comPort or boardSerial is set.';
    } else if (!_.isUndefined(espruino.comPort)) {

      serialPort = new serialPortTop.SerialPort(espruino.comPort, {
        baudrate: 9600
      }, false); // this is the openImmediately flag [default is true]

      serialPort.open(function(err) {
        if (err) {
          done(err);
        }
        open = true;
        done();
      });

    } else if (!_.isUndefined(espruino.boardSerial)) {

      serialPortTop.list(function(err, ports) {

        if (ports.length === 0) {
          done(new Error('no serial ports connected.'));
        }

        var tested = 0;

        ports.forEach(function(port) {
          if (typeof serialPort === 'undefined') {

            var foundHere = false;

            var queryPort = new serialPortTop.SerialPort(port.comName, {
              baudrate: 9600
            }, false); // this is the openImmediately flag [default is true]

            queryPort.open(function(err) {

              var timeouts = 0;
              var wrongSerial = 0;
              var inUse = 0;

              var handleFailure = function(failType) {
                if (failType === 'timeout') {
                  timeouts += 1;
                } else if (failType === 'wrongserial') {
                  wrongSerial += 1;
                } else if (failType === 'inuse') {
                  inUse += 1;
                } else {
                  throw failType;
                }

                tested += 1;
                if (tested === ports.length) {
                  var err = 'coudlnt find any board with serial "' + espruino.boardSerial + '", checked ' + tested + ' ports.\n' +
                    'experienced ' + timeouts + ' timeouts, ' + wrongSerial + ' serial mismatches, and ' + inUse + ' ports in use.';
                  done(new Error(err));
                }
              };

              if (err) {
                handleFailure('inuse');
              } else {
                var timedOut = true;
                command(queryPort, 'getSerial()', function(result) {

                  timedOut = false;
                  var boardSerial = result.substring(1, result.length - 1);
                  if (boardSerial === espruino.boardSerial) {
                    foundHere = true;
                    serialPort = queryPort;
                    espruino.comPort = port.comName;
                    open = true;
                    done();
                  } else {
                    queryPort.close();
                    handleFailure('wrongserial');
                  }
                });

                //were only going to wait 500 msec for this to finish
                setTimeout(function() {
                  if (!foundHere && timedOut) {
                    queryPort.close();
                    handleFailure('timeout');
                  }

                }, 500);
              }

            });

          }
        });

      });

    }

  };

  var write = function(serialPort, text) {
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

    //were going to wrap the text to flash in a self executing anonymous function,
    //to ensure that eveything runs at once.

    text = '(function(){ ' + text + ' })();';

    espruino.reset(function() {
      espruino.command(text, function() {
        espruino.save(function() {
          done();
        });
      });
    });

  };

  var command = function(serialPort, command, done) {

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

        if (matches.length === 0) {
          return false;
        } else {
          var lastLine = matches[matches.length - 1][1];

          return S(lastLine).startsWith('>');
        }

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

        serialPort.removeListener('data', handler);
      }

    };

    serialPort.on('data', handler);
    write(serialPort, command);

  };

  espruino.command = function(text, done) {
    ensureOpend();
    command(serialPort, text, done);
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

module.exports = that;