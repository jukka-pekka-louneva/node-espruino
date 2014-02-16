var assert = require("assert");

var nodeEspruino = require('../node-espruino.js');

var espruino = nodeEspruino.espruino({
	boardSerial: '33FFD605-41573033-15720843'
});

before(function(done) {
	espruino.open(function(err) {
		if (err) {
			throw err;
		}
		done();
	});
});

describe('#simple commands', function() {
	it('should calculate 2+2', function(done) {

		espruino.command('2+2;', function(result) {
			assert.equal(4, result);
			done();
		});

	});

	// it('should calculate multiple equations without interfering.', function(done) {

	// 	var count = 100;

	// 	var goodCount = 0;
	// 	var testCalc = function(number) {
	// 		var command = number + '*2;';
	// 		espruino.command(command, function(result) {
	// 			assert.equal(number * 2, result);
	// 			goodCount += 1;
	// 			if (goodCount === count) {
	// 				done();
	// 			}
	// 		});
	// 	};

	// 	for (var i = 0; i < count; i++) {
	// 		testCalc(i);
	// 	}
	// });
});

describe('#program boards', function() {
	it('should reset board.', function(done) {

		espruino.command('var foo = "bar";', function(result) {
			espruino.command('foo', function(result) {
				assert.equal('"bar"', result);

				espruino.reset(function(result) {
					espruino.command('foo', function(result) {
						assert.equal('undefined', result);
						done();
					});
				});
			});
		});

	});

	it('should save code to flash.', function(done) {

		espruino.reset(function(result) {
			espruino.command('var foo = "bar";', function(result) {
				espruino.save(function(result) {
					espruino.command('load();', function(result) {
						espruino.command('foo', function(result) {
							assert.equal('"bar"', result);
							done();
						});
					});
				});
			});
		});

	});

	it('should load a module.', function(done) {

		espruino.reset(function(result) {

			var module = '';
			module += 'exports.foo = "bar" \n';
			module += 'exports.baz = "blue" \n';

			espruino.addModule('foomod', module, function(result) {
				espruino.command('require("foomod").foo;', function(result) {
					assert.equal('"bar"', result);
					espruino.command('require("foomod").baz;', function(result) {
						assert.equal('"blue"', result);
						done();
					});
				});
			});
		});

	});

	it('should clear modules', function(done) {

		espruino.reset(function(result) {

			espruino.addModule('foomod', 'exports.foo = "bar"', function(result) {
				espruino.command('require("foomod").foo;', function(result) {
					assert.equal('"bar"', result);
					espruino.clearModules(function() {
						espruino.command('require("foomod");', function(result) {
							assert.equal('undefined', result);
							done();
						});
					});
				});
			});
		});

	});

	it('should return an array of modules in the code.', function() {

		var code = 'var blu = red\n';
		code += 'require("fortnight").night(); \n';
		code += 'var bus = require( \'node-bus\' ); \n';
		code += 'var bus = require("./filename.js"); \n';
		code += 'var bus = require("./dir/filename.js"); \n';
		code += 'bugrequire("farquad"); \n'; //this one shouldnt get caught.
		code += 'require("fs"); \n'; //this one shouldnt get caught either since its a built in module.

		var modules = espruino.parseModules(code);

		assert.equal(4, modules.length);
		assert.equal('fortnight', modules[0]);
		assert.equal('node-bus', modules[1]);
		assert.equal('./filename.js', modules[2]);
		assert.equal('./dir/filename.js', modules[3]);

	});

	it('should upload a piece of code, and its required modules.', function(done) {

		var code = '';
		code += 'var bus = require( "bus.espr.js" ).create({axels: 4}); \n';
		code += 'var car = require("./car.espr.js").create({make: "mazda", model: "miata"}); \n';
		code += 'var plane = require("submod/plane.espr.js").create({engines: 2}); \n';
		code += 'var train = require("./submod/train.espr.js").create({type: "passenger"}); \n';
		code += 'bugrequire("farquad"); \n'; //this one shouldnt get caught.
		code += 'require("fs"); \n'; //this one shouldnt get caught either since its a built in module.

		var opts = {
			save: true,
			uploadModules: true,
			moduleDir: 'modules'
		};

		espruino.upload(code, opts, function() {
			espruino.command('bus.axels', function(result) {
				assert.equal('4', result);

				espruino.command('car.make + "," + car.model', function(result) {
					assert.equal('"mazda,miata"', result);

					espruino.command('plane.maxLoad()', function(result) {
						assert.equal('10000', result);
						
						espruino.command('train.type', function(result) {
							assert.equal('"passenger"', result);
							done();
						});
					});
				});
			});
		});

	});

});

after(function(done) {
	espruino.close(function() {
		done();
	});
});