var fs = require('fs');
var assert = require('assert');
var rewire = require("rewire");

var nio = rewire('../skein');

describe("TestSkein", function() {

	it("testPustSkein", function() {
		let skein  = nio.Skein.allocate(1024);
		let skein2 = nio.Skein.allocate(1024);

		skein.put(0x01);
		skein.put(0x02);

		skein2.put(0x03);
		skein2.put(0x04);
		skein2.put(0x05);
		skein2.flip();

		skein.putSkein(skein2);
		skein.flip();

		assert.strictEqual(skein.remaining, 5);
		assert.strictEqual(skein2.remaining, 0);

		assert.strictEqual(skein.get(), 0x01);
		assert.strictEqual(skein.get(), 0x02);
		assert.strictEqual(skein.get(), 0x03);
		assert.strictEqual(skein.get(), 0x04);
		assert.strictEqual(skein.get(), 0x05);
	});

	it("testPutArray", function() {
		let skein  = nio.Skein.allocate(1024);
		skein.putArray([0x01,0x02,0x03,0x04,0x05]);
		skein.flip();
		assert.strictEqual(skein.remaining, 5);
		assert.strictEqual(skein.get(), 0x01);

		skein.clear();
		skein.putArray([0x01,0x02,0x03,0x04,0x05], 2);
		skein.flip();
		assert.strictEqual(skein.remaining, 3);
		assert.strictEqual(skein.get(), 0x03);

		skein.clear();
		skein.putArray([0x01,0x02,0x03,0x04,0x05], 3,1);
		skein.flip();
		assert.strictEqual(skein.remaining, 1);
		assert.strictEqual(skein.get(), 0x04);

	});

	it("testCut", function() {
		let skein  = nio.Skein.allocate(1024);
		skein.putArray([0x01,0x02,0x03,0x04,0x05]);
		skein.flip();

		let skein2 = skein.cut(3);
		assert.strictEqual(skein2.remaining, 3);
		assert.strictEqual(skein2.get(), 0x01);
		assert.strictEqual(skein2.get(), 0x02);
		assert.strictEqual(skein2.get(), 0x03);
	});


	it("testWrap", function() {
		let skein  = nio.Skein.wrap('01 f0 0F');
		assert.strictEqual(skein.get(), 0x01);
		assert.strictEqual(skein.get(), 0xF0);
		assert.strictEqual(skein.get(), 0x0F);

		skein  = nio.Skein.wrap('01, f0, 0F');
		assert.strictEqual(skein.get(), 0x01);
		assert.strictEqual(skein.get(), 0xF0);
		assert.strictEqual(skein.get(), 0x0F);
	});

});