# @ibnlanre/clone

A comprehensive deep cloning utility for JavaScript that handles primitive types, complex objects, and cyclic references with ease.

## Features

- 🔄 **Deep cloning** with cyclic reference handling
- 🏗️ **Preserves prototypes** and object descriptors
- 🎯 **Type-safe** with TypeScript support
- 📦 **Lightweight** with zero dependencies
- 🚀 **Comprehensive** support for all JavaScript types

## Installation

```bash
npm install @ibnlanre/clone
```

## Usage

### ES6 Modules

```javascript
import clone from "@ibnlanre/clone";

const original = { name: "John", age: 30 };
const cloned = clone(original);
```

### CommonJS

```javascript
const clone = require("@ibnlanre/clone");

const original = { name: "John", age: 30 };
const cloned = clone(original);
```

### Browser (via CDN)

```html
<script src="https://unpkg.com/@ibnlanre/clone"></script>
<script>
  const cloned = clone({ name: "John", age: 30 });
</script>
```

## Supported Types

### Primitives

All primitive types are handled correctly:

```javascript
clone(undefined); // → undefined
clone(null); // → null
clone(true); // → true
clone(42); // → 42
clone("hello"); // → "hello"
clone(BigInt(123)); // → 123n
clone(Symbol("id")); // → Symbol(id)
```

### Objects and Arrays

```javascript
// Plain objects
const obj = { a: 1, b: { c: 2 } };
const clonedObj = clone(obj);

// Arrays
const arr = [1, [2, 3], { d: 4 }];
const clonedArr = clone(arr);

// Nested structures
const complex = {
  users: [
    { id: 1, profile: { name: "Alice" } },
    { id: 2, profile: { name: "Bob" } },
  ],
};
const clonedComplex = clone(complex);
```

### Functions

Functions are cloned with all their properties preserved:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
greet.customProp = "custom value";
greet.prototype.sayGoodbye = () => "Goodbye!";

const clonedGreet = clone(greet);
clonedGreet("World"); // → "Hello, World!"
clonedGreet.customProp; // → "custom value"
clonedGreet.prototype.sayGoodbye(); // → "Goodbye!"
clonedGreet !== greet; // → true (different reference)
```

### Built-in Objects

#### Dates

```javascript
const date = new Date("2023-12-25");
const clonedDate = clone(date);
// → 2023-12-25T00:00:00.000Z
```

#### Regular Expressions

```javascript
const regex = /hello/gi;
const clonedRegex = clone(regex);
// → /hello/gi (with same flags)
```

#### Maps

```javascript
const map = new Map([
  ["key1", "value1"],
  ["key2", { nested: "object" }],
]);
const clonedMap = clone(map);
// → Map with deeply cloned keys and values
```

#### Sets

```javascript
const set = new Set([1, { a: 2 }, [3, 4]]);
const clonedSet = clone(set);
// → Set with deeply cloned values
```

#### ArrayBuffers and Typed Arrays

```javascript
// ArrayBuffer
const buffer = new ArrayBuffer(16);
const clonedBuffer = clone(buffer);

// Typed Arrays
const int32Array = new Int32Array([1, 2, 3, 4]);
const clonedInt32Array = clone(int32Array);

// DataView
const dataView = new DataView(buffer, 4, 8);
const clonedDataView = clone(dataView);
```

#### Error Objects

```javascript
const error = new Error("Something went wrong");
error.code = "E001";
error.details = { timestamp: Date.now() };

const clonedError = clone(error);
// → Error with message, stack, and custom properties cloned
```

#### URLs

```javascript
const url = new URL("https://example.com/path?query=value");
const clonedUrl = clone(url);

const params = new URLSearchParams("a=1&b=2");
const clonedParams = clone(params);
```

### Cyclic References

Handles circular references without infinite loops:

```javascript
const obj = { name: "parent" };
obj.child = { name: "child", parent: obj };
obj.self = obj;

const cloned = clone(obj);
// → Properly cloned with circular references preserved
cloned.child.parent === cloned; // → true
cloned.self === cloned; // → true
```

### Prototype Preservation

Object prototypes and property descriptors are preserved:

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, I'm ${this.name}`;
  }
}

const person = new Person("Alice");
const clonedPerson = clone(person);

clonedPerson instanceof Person; // → true
clonedPerson.greet(); // → "Hello, I'm Alice"
clonedPerson !== person; // → true
```

## API Reference

### `clone<T>(value: T, visited?: WeakMap): T`

Creates a deep clone of the provided value.

**Parameters:**

- `value` - The value to clone
- `visited` - (Optional) WeakMap for tracking circular references

**Returns:**

- A deep clone of the input value

**Type Safety:**

- Maintains TypeScript type information
- Returns the same type as the input

## Performance Notes

- Uses `WeakMap` for efficient circular reference tracking
- Minimizes object creation for primitive types
- Preserves prototype chain without unnecessary copying
- Optimized for common use cases

## License

MIT © [Ridwan Olanrewaju](https://github.com/ibnlanre)
