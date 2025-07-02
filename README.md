# Clone

Clone any and every JS type, well somewhat.

## Install

```bash
npm i @ibnlanre/clone
```

## Import

```javascript
// Browser
<script src="https://unpkg.com/@ibnlanre/clone"></script>;

// ES6 Import
import clone from "@ibnlanre/clone"

// NodeJS Require
const clone = require("@ibnlanre/clone");
```

## Primitives

```javascript
clone(undefined); //-> undefined
clone(true); //-> true
clone(0); //-> 0
clone("foo"); //-> 'foo'
clone(BigInt(10)); //-> 10n
clone(Symbol("foo")); //-> Symbol(foo)
clone(null); //-> null
```

## Reference Types

### Cyclic Objects

```javascript
const obj = { foo: { bar: null } };
obj.foo.bar = obj.foo;
clone(obj); //=> { foo: { bar: [Circular] } }
```

### Functions

#### Function Statements

```javascript
function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError("array-unique expects an array.");
  }
  return arr.length;
}
unique.prototype.greet = () => "hello";
clone(unique)([1, 2, 3]); //-> 3
clone(unique).prototype.greet(); //-> hello
```

#### Function Expressions

```javascript
let test = function () {
  return 0;
};
clone(test); //-> [Function: test]
clone(test).toString(); //-> function(){ return 0 }
clone(test) === test; //-> false
```

#### Asynchronous Functions

```javascript
clone(async (a, b) => a + b); //-> async (a, b) => a + b
```

#### Generator Functions

```javascript
clone(function* (b, c) {
  yield 0;
}); //-> [GeneratorFunction]
```

#### Arrow functions

```javascript
clone(() => {}).toString(); //-> () => { }
```

### Arrays

```javascript
let sequence = [1, 1, [2, 5], 3, 5];
clone(sequence); //-> [1, 1, [2, 5], 3, 5]
```

#### Typed Arrays

```javascript
clone(new Int8Array(2)); //-> Int8Array [ 0, 0 ]
clone(new Uint8Array(2)); //-> Uint8Array [ 0, 0 ]
clone(new Uint8ClampedArray(new ArrayBuffer(6), 1, 4));
//-> Uint8ClampedArray [ 0, 0, 0, 0 ]

clone(new Int16Array(2)); //-> Int16Array [ 0, 0 ]
clone(new Uint16Array(2)); //-> Uint16Array [ 0, 0 ]

clone(new Int32Array(2)); //-> Int32Array [ 0, 0 ]
clone(new Uint32Array(2)); //-> Uint32Array [ 0, 0 ]

clone(new Float32Array(2).BYTES_PER_ELEMENT); //-> 4
clone(new Float64Array(2).BYTES_PER_ELEMENT); //-> 8

clone(new BigInt64Array([21n, 31n])); //-> BigInt64Array [ 21n, 31n ]

var iterable = (function* () {
  yield* [1n, 2n, 3n];
})();
var biguint64 = new BigUint64Array(iterable);
clone(biguint64); //-> BigUint64Array[1n, 2n, 3n]
```

### Buffers

```javascript
clone(new ArrayBuffer(8));
/*
    ArrayBuffer {
      [Uint8Contents]: <00 00 00 00 00 00 00 00>,
      byteLength: 8
    }
*/
```

### Dates

```javascript
clone(new Date("1986-05-21T00:00:00.000Z"));
//-> 1986-05-21T00:00:00.000Z
```

### Maps

```javascript
const map = new Map();
map.set("foo", "bar");
map.set("baz", "qux");
clone(map); //-> Map(2) { 'foo' => 'bar', 'baz' => 'qux' }
```

### Sets

```javascript
const set = new Set();
set.add("foo");
set.add("bar");
clone(set); //-> Set(2) { 'foo', 'bar' }
```
