# zzz.skein

[![NPM version](http://img.shields.io/npm/v/zzz.skein.svg)](https://www.npmjs.org/package/zzz.skein)


### Description
    
Skein is a library like "java.nio.ByteBuffer" of java. 
In data communication, a module should efficiently manipulate byte streams. 
Because allocating and releasing memory is a costly task. 

Skein provides functions to reuse "Buffer" in node.js, so reducing overheads.
Function definitions referenced "java.nio.ByteBuffer" of java.

### Installation

npm install skein

# Documents

### mark, position, limit, capacity

Skein uses some attributes for manipulating "Buffer" of Node.

0 <= mark <= position <= limit <= capacity

* capacity: a total size of "Buffer", size == bytes count. readonly
* limit : max index {position} can reach.
* position: index of "Buffer" to be read or written
* mark : when reset {position}, this value will be assigned to {position}

### allocate, wrap

.allocate(), .wrap() are static functions that initialize "Buffer".
```
let buf = Skein.allocate(1024)
```
{buf} has 1024 bytes "Buffer". .allocate() function set attributes, capacity=1024, limit=1024, position=0, mark=0
```
let buf = Skein.wrap([0x00, 0x01, 0x02, 0x03]);
```
{buf} has 4 bytes "Buffer" and it contains [0x00, 0x01, 0x02, 0x03]. Attributes are, capacity=4, limit=4, position=0, mark=0

### get, put

You can read or write a byte from Skein by calling get(), put().

let buf = Skein.wrap([0x00, 0x01, 0x02, 0x03]);
let b = buf.get();

The variable 'b' has 0x00. and position=1 where you can read or write next.
```
b = buf.get()  // b=0x01, position=2
b = buf.get()  // b=0x02, position=3
b = buf.get()  // b=0x03, position=4
b = buf.get()  // overflow !!!,  next position=5 > limit=4
```

The above codes show position's role, the position has index you can read next. 
The last line is error(overflow), because next position 5 is over limit.

put() same as get()...

```
let buf = Skein.allocate(4);
buf.put(0x00);  // buf contains [0x00,,,]  position=1
buf.put(0x01);  // buf contains [0x00,0x01,,]  position=2
buf.put(0x02);  // buf contains [0x00,0x01,0x02,]  position=3
buf.put(0x03);  // buf contains [0x00,0x01,0x02,0x03]  position=4
buf.put(0x04);  // overflow !!!
```

### flip()

flip() set {limit} to current {position} and set {position},{mark} to 0.
```
let buf = Skein.allocate(4);  // position=0, limit=4
buf.put(0x00);
buf.put(0x01);
buf.put(0x02);      // position=3, limit=4

buf.flip();         // position=0, limit=3

let b = buf.get();  // b = 0x00
let b = buf.get();  // b = 0x01
let b = buf.get();  // b = 0x02
let b = buf.get();  // overflow !!!   next position=4 > limit=3
``` 
In the above codes, flip() makes Skein to get the previous put data.


### rewind(), clear()

rewind() only set {position},{mark} to 0. It may be used to read data again.

clear() set {limit} to {capacity} and set {position},{mark} to 0.
It makes Skein to be cleared.

### mark(), reset()

mark() set {mark} to current {position}

reset() set {position} to {mark}


### compact()

The bytes between the buffer's current position and its limit, if any, are copied to the beginning of the buffer.
compact() set {position} to next index of the bytes and set {limit} to {capacity}

```
let buf = Skein.allocate(10);  // position=0, limit=10
buf.put(0x00);
buf.put(0x01);
buf.put(0x02);
buf.put(0x03);
buf.put(0x04);      // position=5, limit=10   
// [0x00,0x01,0x02,0x03,0x04,,,,,]

buf.flip();         // position=0, limit=5

let b = buf.get();  // b = 0x00
let b = buf.get();  // b = 0x01
let b = buf.get();  // b = 0x02   // position=3, limit=5
// [0x00,0x01,0x02,0x03,0x04,,,,,]

buf.compact();      // position=2, limit=10
// [0x03,0x04,,,,,,,,]

buf.put(0x05);      // position=3, limit=10
// [0x03,0x04,0x05,,,,,,,]

```

### attributes

* capacity: a total size of "Buffer", size == bytes count. readonly
* limit : max index {position} can reach.
* position: index of "Buffer" to be read or written
* buf : raw "Buffer"
* remaining : a count of remain bytes = {limit} - {position}
* hasRemaining : whether remaining > 0 or not
