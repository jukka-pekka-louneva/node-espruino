# node-espruino #

An easy to use node module for interfacing with an espruino as well as a cli for deploying to one.


## Using from node ##

```
	var nodeEspruino = require('node-espruino');

	var espruino = nodeEspruino.espruino({
		serialport: 'COM4'
	});

	espruino.open(function(){
		espruino.on('data', function(data){
			console.log('Data received: ' data);
		});

		espruino.write('1+2');
	});
```

## Using from shell ##

Install.

```
	npm install node-espruino -g
```

Use.

```
	$ espruino deploy test.js --port COM4
```

if you know the pnpId of the board, you can refer to it by id:

```
	$espruino deploy test.js --id 'USB\VID_0483&PID_5740\48DF71483330'
```

## Issues ##

* The command line functionality doesnt like arguments with & in them, everything after gets truncated.
* The board is remembering things after reset has been called, I believe this is a issue with the board itself.