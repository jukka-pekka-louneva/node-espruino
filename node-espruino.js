/* global require */
/* global module */

var serialPortTop = require('serialport');
var _ = require('lodash');
var S = require('string');
var fs = require('fs');
var path = require('path');

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

        ports.forEach(function(port) {
          if (typeof serialPort === 'undefined') {

            var foundHere = false;

            var queryPort = new serialPortTop.SerialPort(port.comName, {
              baudrate: 9600
            }, false); // this is the openImmediately flag [default is true]

            queryPort.open(function(err) {

              if (err) {
                handleFailure('inuse');
              } else {

                //were only going to wait 500 msec for this to finish
                var timedout = true;
                setTimeout(function() {
                  if (!foundHere && timedout) {
                    queryPort.close();
                    handleFailure('timeout');
                  }

                }, 500);

                command(queryPort, 'getSerial()', function(result) {

                  timedout = false
                  //timedOut = false;
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

  /*
    opts: {
      save: (true|false),
      uploadModules: (true|false), //whether to upload modules found in code.
      moduleDir: 'pathToDir' // specify directory to search for modules in.
    }
   */
  espruino.upload = function(code, opts, done) {
    ensureOpend();

    if (_.isUndefined(opts.moduleDir)) {
      opts.moduleDir = './';
    }

    var modules;
    if (opts.uploadModules) {

      var moduleDir = path.normalize(opts.moduleDir);

      var loadModules = function(code, workingDir) {

        var modules = [];

        espruino.parseModules(code).forEach(function(moduleName) {

          var modulePath = path.resolve(workingDir, moduleName);

          if (!fs.existsSync(modulePath)) {
            throw modulePath + ' does not exist';
          }

          var module = {
            name: moduleName,
            path: modulePath,
            content: fs.readFileSync(modulePath, 'utf8')
          };

          var subModules = loadModules(module.content, path.dirname(module.path));

          modules = modules.concat(subModules);

          modules.push(module);
        });

        return modules;
      };

      modules = loadModules(code, moduleDir);

    }

    done = _.isUndefined(done) ? function() {} : done;

    espruino.reset(function() {

      var uploadCode = function() {
        espruino.commandWrapped(code, function() {
          if (opts.save) {
            espruino.save(function() {
              done();
            });
          } else {
            done();
          }
        });
      };

      if (opts.uploadModules && modules.length > 0) {

        var uploadModule = function(index) {
          if (index !== modules.length) {
            var module = modules[index];
            espruino.addModule(module.name, module.content, function() {
              uploadModule(index + 1);
            });
          } else {
            uploadCode(); // were done uploading modules, upload the code.
          }
        };

        uploadModule(0);
      } else {
        uploadCode();
      }

    });

  };

  espruino.addModule = function(name, code, done) {
    name = JSON.stringify(name);
    code = JSON.stringify(code);
    espruino.commandWrapped('Modules.addCached(' + name + ',' + code + ');', function() {
      done();
    });
  };

  espruino.clearModules = function(done) {
    espruino.command('Modules.removeAllCached();', function() {
      done();
    });
  };

  espruino.parseModules = function(code) {
    // this is pulled from https://github.com/espruino/EspruinoWebIDE/blob/master/js/espruino_modules.js#L126
    // it has the same bug as that does, if the users code has
    // anything containing `require` it will be grabbed by the regex. 
    // the suggested fix is to use a javascript lexer to parse the javascript instead of using a regex

    var modules = [];
    var requires = code.match(/\brequire\( *(\"|\')([^(\"|\')]*)(\"|\') *\)/g);
    for (var i in requires) {
      // strip off beginning and end, and parse the string
      //var module = JSON.parse(requires[i].substring(8, requires[i].length - 1));
      var rawName = requires[i].substring(8, requires[i].length - 1);
      rawName = rawName.replace(/\'/g, '"');
      var module = JSON.parse(rawName);
      var builtin_modules = ["http", "fs", "CC3000"]; // espruino has these modules built in, ignore them.
      if (builtin_modules.indexOf(module) < 0 && modules.indexOf(module) < 0)
        modules.push(module);
    }
    return modules;
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

  espruino.commandWrapped = function(text, done) {
    ensureOpend();
    espruino.command('{ ' + text + ' };', done);
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