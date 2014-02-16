var car = (function() {
	var my = {};

	return function(spec) {
		var that = {};

		that.make = spec.make;
		that.model = spec.model;
		that.refdmod = require('refdmod.js').foo;

		return that;
	};
})();

exports.create = car;