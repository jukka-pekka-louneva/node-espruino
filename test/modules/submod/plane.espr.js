var plane = (function() {
	var my = {};

	return function(spec) {
		var that = {};

		that.engines = spec.engines;

		that.maxLoad = function() {
			return that.engines * 5000;
		};

		return that;
	};
})();

exports.create = plane;