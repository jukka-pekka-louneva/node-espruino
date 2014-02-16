var bus = (function() {
	var my = {};

	return function(spec) {
		var that = {};

		that.axels = spec.axels;

		return that;
	};
})();

exports.create = bus;