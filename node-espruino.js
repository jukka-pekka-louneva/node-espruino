var serialPortTop = require('serialport');

var that = {};

that.espruino = function(spec) {
  'use strict';

  var espruino = {
    serialport: spec.serialport
  };

  var serialPort = new serialPortTop.SerialPort(espruino.serialport, {
    baudrate: 9600
  }, false); // this is the openImmediately flag [default is true]

  var open = false;
  var ensureOpend = function() {
    if (!open) {
      throw 'connection must be opened before it can be used';
    }
  };

  espruino.open = function(done) {
    serialPort.open(function(err) {
      if (err) {
        throw err;
      }
      open = true;
      done();
    });
  };

  espruino.write = function(text) {
    ensureOpend();
    serialPort.write(text, function(err) {
      if (err) {
        throw err;
      }
    });
  };

  espruino.on = function(event, func) {
    if (event === 'data') {
      ensureOpend();
      serialPort.on('data', func);
    } else {
      throw 'event not supported: ' + event;
    }
  };

  espruino.close = function(done) {
    serialPort.close(done);
  };

  return espruino;

};

module.exports = that;