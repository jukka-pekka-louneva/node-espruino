var lit = false;

setInterval(function() {
	lit = !lit;
	digitalWrite(LED1, lit);
}, 100);