# node-espruino #

An easy to use node module for interfacing with a micro controller running [espruino](http://www.espruino.com/) as well as a cli.


## Using from node ##

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

## Using from shell ##

Install.

```
npm install node-espruino -g
```

Use.

```
$ echo 'digitalWrite(LED1, true);' > led.js
$ espruino flash led.js
```

if you know the serial number of the board, you can refer to it by serial:

```
$ espruino flash led.js --boardserial '33FFD605-41573033-15720843'
```

## Issues ##

* The command line functionality doesnt like arguments with & in them, everything after gets truncated.
* The board is remembering things after reset has been called, I believe this is a issue with the board itself. [Reported here](https://github.com/espruino/Espruino/issues/231).
# We dont actually sort getting a board by serial number yet, still need to implement that.