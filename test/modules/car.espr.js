var car = (function() {
	var my = {};

	return function(spec) {
		var that = {};

		that.make = spec.make;
		that.model = spec.model;

		return that;
	};
})();

exports.create = car;