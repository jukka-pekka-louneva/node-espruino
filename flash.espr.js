var lit = false;

var index = 0;

setInterval(function() {
	'use strict';

	index += 1;

	if (index === 3) {
		index = 0;
	}

	if (index === 0) {
		digitalWrite(LED1, true);
		digitalWrite(LED2, false);
		digitalWrite(LED3, false);
		print('flashing LED1');
	} else if (index === 1) {
		digitalWrite(LED1, false);
		digitalWrite(LED2, true);
		digitalWrite(LED3, false);
		print('flashing LED2');
	} else if (index === 2) {
		digitalWrite(LED1, false);
		digitalWrite(LED2, false);
		digitalWrite(LED3, true);
		print('flashing LED3');
	}

}, 100);