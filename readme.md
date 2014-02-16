node-espruino
=============

An easy to use node module for interfacing with a micro controller running [espruino](http://www.espruino.com/) as well as a cli.
[Available as a Grunt task](https://www.npmjs.org/package/grunt-espruino).

Using from node
---------------

```
var nodeEspruino = require('node-espruino');

var espruino = nodeEspruino.espruino({
	comPort: 'COM4'
});

espruino.open(function(){
	espruino.command('1+2', function(result){
		console.log(result);
	});
});
```

Using from shell
----------------


Install.

```
npm install node-espruino -g
```

Use.

```
$ echo 'digitalWrite(LED1, true);' > led.js
$ espruino upload led.js --save
```

if you know the serial number of the board, you can refer to it by serial:

```
$ espruino upload led.js --save --boardserial '33FFD605-41573033-15720843'
```

API Reference
-------------

### espruino

Returns a new espruino. `comPort` or `boardSerial` must be specified. Before any communication can 
be made to the espruino board the `open` function must be called, which acepts a callback to be
executed on completion.

#### options

`comPort`

COM address to connect to.

`boardSerial` 

Serial (as in board manufacturer serial number, not COM port.)
of board you want to connect to.
	
#### methods

##### function open( function done(err) )

This function must be called before any other function, it opens communication to the espruino board.
Accepts a callback to be run when communication is established.

##### function command(text, function done(result) )

Executes text on espruino, calls `done` on completion with result of command. 

##### function reset(done)

Resets boards memory to default, dumping all loaded code. `done` is a callback that executes after reset completes.

##### function save()

Saves loaded code to flash. Preserves after board hard reset and loss of power. `done` is a callback that executes after reset completes.

##### function upload(code, options, function done() )
`options`:
* `save: [true| false]` whether to save the loaded code to the to the espruinos onboard flash.
* `uploadModules: [true | false]` if true, module requires are parsed out of `code` and uploaded.
* `moduleDir: 'Path'` the root directory to look for modules.

Convenience function. Parses out modules from code and loads from disk, resets board, then uploads `code`. 

##### function dump(function done(result))

Dumps loaded code from espruino.

##### function addModule(name, code, function done)

Adds a module with the specified name and code to the espruino. It can then be loaded by 
running `require('name')` on the espruino.

##### function clearModules(function done)

Clears all loaded modules from espruino.

##### function parseModules(code)

Returns an array of all modules defined in `code`. Parses out `require('module')` from input code.

##### function close(function done() )

Closes serial connection to espruino.

#### events

`.on('data', function callback(data) )`

when espruino writes data back over serial, callback is called with data.

## CLI Reference
----------------

### Global arguments

`--port [COM Port]`

`--boardserial [Board Serial No]`

`--listen`

If listen is specified, after the command is completed we will leave the serial connection open and print from the espruino.

### Commands

`upload [file] --save`

Flashes the specified file to the espruino. If `save` is specified the uploaded code is saved to flash.

## Issues
---------

* The command line functionality doesnt like arguments with & in them, everything after gets truncated.
* The board is remembering things after reset has been called, I believe this is a issue
	with the board itself. [Reported here.](https://github.com/espruino/Espruino/issues/231).

## ToDo
-------

Nothing now. Yay!