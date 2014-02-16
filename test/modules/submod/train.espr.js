var train = (function() {
	var my = {};

	return function(spec) {
		var that = {};

		that.type = spec.type;

		return that;
	};
})();

exports.create = train;