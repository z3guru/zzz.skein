/*
 ISC License

 Copyright (c) 2019, ZCUBE LC

 Permission to use, copy, modify, and/or distribute this software for any
 purpose with or without fee is hereby granted, provided that the above
 copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const __ascii = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const __utils = {

	itoa: function(bb, sz, pad)
	{
		let s = '';
		let vv = bb;
		let len = isNaN(sz) ? 0 : sz;
		let cnt = 0;

		while(len == 0 || (cnt++ < len))
		{
			let nn = vv & 0x0F;
			s =  __ascii[nn] + s;

			vv = vv >> 4;
			if ( vv == 0 )
			{
				if ( pad !== undefined ) s = s.padStart(sz, pad);
				break;
			}
		}

		return s;
	}
}

const __radix = { HEX:'hex' };

class Skein
{
	/**
	 *
	 * @param param a size of a buffer OR a buffer from Buffer
	 */
	constructor(param, order)
	{
		if ( param instanceof Buffer ) this._buf = param;
		else if ( typeof(param) === "number") this._buf = Buffer.alloc(param);
		else if ( Array.isArray(param) ) this._buf = Buffer.from(param);
		else
			throw "invalid parameters";

		this._mark = this._position = 0;
		this._limit = this._buf.length;
		this.order = order === undefined ? Skein.BIG_ENDIAN : order;
	}

	static get LITTLE_ENDIAN()  { return 0; };
	static get BIG_ENDIAN()     { return 1; };
	static allocate(sz)
	{
		return new Skein(sz);
	}

	/**
	 * This function can work if the parameter 'bbuf' is a string, array or Buffer.
	 * If bbuf is a string, the following parameters may be used.
	 *
	 * @param bbuf
	 * @param separator
	 * @returns {undefined}
	 */
	static wrap(bbuf, separator)
	{
		let s;

		if ( typeof bbuf == 'string' )
		{
			let sbuf = bbuf.replace(separator === undefined ? /[^a-fA-F0-9]+/g : separator, '');
			s = new Skein(Buffer.from(sbuf, 'hex'))
		}
		else
			s = Array.isArray(bbuf) ? new Skein(Buffer.from(bbuf)) : new Skein(bbuf);

		return s;
	}

	get buf() { return this._buf; }

	get capacity() { return this._buf.length; }

	get limit() { return this._limit }
	set limit(val) { this._limit = val; }

	get position() { return this._position }
	set position(val) { this._position = val; }

	get remaining() { return this._limit - this._position; }
	get hasRemaining() { return this.remaining > 0; }

	put(b)
	{
		if ( this.remaining == 0 ) throw "Buffer overflow";
		this._buf.writeUInt8(b, this._position++);
	}

	get()
	{
		if ( this.remaining == 0 ) throw "Buffer overflow";
		return this._buf.readUInt8(this._position++);
	}

	putInt(vv, sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		this._writeInt.call(this._buf, vv, this._position, sz);
		this._position += sz;
	}

	getInt(sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		var value = this._readInt.call(this._buf, this._position, sz);
		this._position += sz;

		return value;
	}

	putShort(vv) { this.putShort(vv, 2); }
	getShort() { return this.getInt(2); }

	putUInt(vv, sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		this._writeUInt.call(this._buf, vv, this._position, sz);
		this._position += sz;
	}

	getUInt(sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		var value = this._readUInt.call(this._buf, this._position, sz);
		this._position += sz;

		return value;
	}

	putFloat(vv)
	{
		if ( this.remaining < 4 ) throw "Buffer overflow";
		this._writeFloat.call(this._buf, vv, this._position);
		this._position += 4;
	}

	getFloat()
	{
		if ( this.remaining < 4 ) throw "Buffer overflow";
		var value = this._readFloat.call(this._buf, this._position);
		this._position += 4;

		return value;
	}

	putDouble(vv)
	{
		if ( this.remaining < 8 ) throw "Buffer overflow";
		this._writeDouble.call(this._buf, vv, this._position);
		this._position += 8;
	}

	getDouble()
	{
		if ( this.remaining < 8 ) throw "Buffer overflow";
		var value = this._readDouble.call(this._buf, this._position);
		this._position += 8;

		return value;
	}

	putArray(arr, pos, offset)
	{
		if ( this.remaining < offset ) throw "Buffer overflow";
		let that = this;
		let from = pos === undefined ? 0 : pos;
		let to = offset === undefined ? arr.length : from + offset;
		arr.slice(from, to).forEach(b => that.put(b));
	}

	putBuffer(bbuf, pos, offset)
	{
		if ( bbuf.length > this.remaining ) throw "Buffer overflow";

		var ppos = isNaN(pos) ? 0 : pos;
		var ooff = isNaN(offset) ? bbuf.length : offset;
		bbuf.copy(this._buf, this._position, ppos, ppos + ooff)
		this._position = ppos + ooff;
	}

	putSkein(skein, sz)
	{
		if ( sz === undefined ) sz = skein.remaining;
		else if ( sz > skein.remaining ) throw "Buffer overflow";

		if ( sz > this.remaining ) throw "Buffer overflow";

		let ppos = skein.position;
		let ooff = sz;

		skein.buf.copy(this._buf, this._position, ppos, ppos + ooff);
		skein.position += ooff;
		this._position += ooff;
	}

	get order() { return this._order; }
	set order(ord)
	{
		if ( this._order == ord ) return;

		if ( ord == Skein.LITTLE_ENDIAN )
		{
			this._readInt = this._buf.readIntLE;
			this._readUInt = this._buf.readUIntLE;
			this._readFloat = this._buf.readFloatLE;
			this._readDouble = this._buf.readDoubleLE;

			this._writeInt = this._buf.writeIntLE;
			this._writeUInt = this._buf.writeUIntLE;
			this._writeFloat = this._buf.writeFloatLE;
			this._writeDouble = this._buf.writeDoubleLE;
		}
		else
		{
			this._readInt = this._buf.readIntBE;
			this._readUInt = this._buf.readUIntBE;
			this._readFloat = this._buf.readFloatBE;
			this._readDouble = this._buf.readDoubleBE;

			this._writeInt = this._buf.writeIntBE;
			this._writeUInt = this._buf.writeUIntBE;
			this._writeFloat = this._buf.writeFloatBE;
			this._writeDouble = this._buf.writeDoubleBE;
		}

		this._order = ord;
	}

	clear()
	{
		this._mark = this._position = 0;
		this._limit = this.buf.length;
	}

	flip()
	{
		this._limit = this._position;
		this._mark = this._position = 0;
	}

	rewind()
	{
		this._mark = this._position = 0;
	}

	mark()
	{
		this._mark = this._position;
	}

	reset()
	{
		this._position = this._mark;
	}

	compact()
	{
		this.buf.copy(this.buf, 0, this._position, this._limit);
		this._position = this._limit - this._position;
		this._limit = this.capacity;
	}

	skip(sz)
	{
		if ( sz > this.remaining ) throw "Buffer overflow";
		this._position += sz;
	}

	/**
	 * make duplicate buf, but set dup's limit is set by position + sz
	 * and source yarn's position is set by being added sz(consumed)
	 *
	 * @param sz
	 * @returns {Skein}
	 */
	cut(sz)
	{
		let piece = new Skein(this._buf, this.order);
		piece._position = this._position;
		piece._limit = this._position + sz;
		this._position += sz;

		return piece;
	}

	duplicate()
	{
		let dup = new Skein(this._buf, this.order);
		dup._position = this._position;
		dup._limit = this._limit;

		return dup;
	}

	toHexString()
	{
		let dup = this.duplicate();

		let cols = 0;
		let str = '';
		let bin = '';
		let txt = '';
		while(dup.hasRemaining)
		{
			let bb = dup.get();
			bin += __utils.itoa(bb, 2, '0') + ' ';
			txt += (bb >= 0x20 && bb <= 0x7E) ? String.fromCharCode(bb) : '.';

			if ( ++cols == 16 )
			{
				cols = 0;
				str += (bin + '\t' + txt + '\n');
				bin = txt = '';
			}
		}

		if ( cols > 0 )
		{
			for ( ; cols < 16; cols++ ) bin += '   ';
			str += (bin + '\t' + txt + '\n');
		}

		return str;
	}
}

module.exports = {
	Skein: Skein
	, Util: __utils
}