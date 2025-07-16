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

### `createCloneFunction(registryModifier?: CloneRegistryModifier): CloneFunction`

Creates a custom clone function with optional registry modifications.

**Parameters:**

- `registryModifier` - (Optional) Function to customize the clone registry

**Returns:**

- A customized clone function

### `CloneRegistry`

Manages clone handlers and validators for different types.

**Methods:**

- `setHandler<T>(constructor, handler, validator?)` - Register a handler and optional validator
- `getHandler(value)` - Get handler and validator for a value
- `hasHandler(constructor)` - Check if a handler exists

### `Validators`

Pre-built validators for common JavaScript types.

**Available Validators:**

- `Array`, `Object`, `Function`, `Date`
- `AsyncFunction`, `GeneratorFunction`, `AsyncGeneratorFunction`

### `Handlers`

Pre-built clone handlers for common JavaScript types.

## Advanced Usage

### Creating Custom Clone Functions

The library provides powerful customization capabilities through `createCloneFunction` and the registry system. This allows you to create specialized clone functions that handle specific types or structures in your application.

#### Type Validation System

Validators provide an additional layer of type safety when cloning objects. They ensure that values are of the expected type before before returning the cloned value. Otherwise, the clone function will return the original value without cloning.

```javascript
import { Validators } from "@ibnlanre/clone";

// Create custom validators
const customValidators = {
  // Validate a specific custom class
  CustomClass: (value) => value instanceof CustomClass && value.isValid,

  // Validate objects with specific properties
  ConfigObject: (value) => {
    return (
      typeof value === "object" &&
      value !== null &&
      "config" in value &&
      "version" in value
    );
  },

  // Validate arrays with specific structure
  UserArray: (value) => {
    return (
      Array.isArray(value) &&
      value.every((item) => item && typeof item.id === "string")
    );
  },
};
```

#### Custom Clone Handlers with Validators

The `createCloneFunction` can now use these validators to ensure type safety when cloning. The created clone function internally handles primitive types, and cyclic references on every handler set, so you can focus on defining custom logic for specific types.

```javascript
import { Handlers, createCloneFunction } from "@ibnlanre/clone";

const customHandlers = {
  CustomClass: (value, visited, clone) => {
    // Custom cloning logic for CustomClass
    const result = new CustomClass(clone(value.data, visited));
    result.timestamp = value.timestamp; // Preserve original timestamp
    visited.set(value, result);
    return result;
  },
};

// Create a custom clone function with registry modifier
const clone = createCloneFunction((registry) => {
  // Register handler with custom validator
  registry
    .setHandler(
      CustomClass,
      customHandlers.CustomClass,
      customValidators.CustomClass
    )
    .setHandler(
      // Use built-in validators
      CustomFunction,
      Handlers.Function,
      Validators.Function
    );
});
```

**Benefits of Using Validators:**

- **Type Safety**: Ensure values match expected types before cloning
- **Error Prevention**: Catch type mismatches early in the cloning process
- **Debugging**: Better error messages when validation fails
- **Performance**: Skip inappropriate handlers for better performance

### Built-in Handlers and Validators

The library exports pre-built handlers and validators you can reuse:

```javascript
import { createCloneFunction, Handlers, Validators } from "@ibnlanre/clone";

const customClone = createCloneFunction((registry) => {
  // Use identity handler for custom types (no cloning)
  registry.setHandler(ImmutableType, Handlers.Identity);

  // Use object handler for plain object-like types
  registry.setHandler(PlainObjectType, Handlers.Object);

  // Use array handler for array-like types with array validator
  registry.setHandler(ArrayLikeType, Handlers.Array, Validators.Array);

  // Use function handler with function validator
  registry.setHandler(CallableType, Handlers.Function, Validators.Function);
});
```

**Available Built-in Validators:**

- `Validators.Array` - Validates arrays
- `Validators.Object` - Validates objects
- `Validators.Function` - Validates functions
- `Validators.Date` - Validates Date objects
- `Validators.AsyncFunction` - Validates async functions
- `Validators.GeneratorFunction` - Validates generator functions
- `Validators.AsyncGeneratorFunction` - Validates async generator functions

#### Handler Function Signature

Custom handlers receive three parameters:

```typescript
type CloneHandler<T> = (
  value: T, // The value to clone
  visited: WeakMap<object, any>, // Circular reference tracker
  clone: CloneFunction // The clone function for recursive cloning
) => T;
```

Custom validators receive one parameter and return a boolean:

```typescript
type CloneValidator = (
  value: any // The value to validate
) => boolean;
```

**Important**:

- Always call `visited.set(value, result)` before recursively cloning properties to prevent infinite loops with circular references.
- Validators are optional but recommended for type safety and better error handling.
- If no validator is provided, the handler will be used for any value of that constructor type.

## Performance

### 🏆 **Exceptional Performance**

This clone utility delivers **world-class performance** across all JavaScript data types:

- **Simple Objects**: **2.57M operations/sec** (0.0004ms per clone)
- **Circular References**: **1.64M operations/sec** (0.0006ms per clone)
- **Functions**: **2.31M operations/sec** (0.0004ms per clone)
- **Complex Objects**: **25.4K operations/sec** (0.0394ms per clone)
- **Comprehensive Data Types**: **93.4K operations/sec** (0.0107ms per clone)

### ⚡ **3x Faster Than JSON**

When compared to `JSON.parse(JSON.stringify())`:

- **Clone**: 10,680 ops/sec for complex objects
- **JSON method**: 3,555 ops/sec for same objects
- **Result**: **3x faster** with full feature support!

_Critical advantage: JSON method fails on functions, dates become strings, no circular references, loses prototypes, etc._

### 🎯 **Production-Ready Features**

- **Linear Scaling**: Predictable O(n) performance across object sizes
- **Memory Efficient**: Uses WeakMap for cycle detection without memory leaks
- **Comprehensive Types**: Handles all JavaScript types including advanced ones
- **Robust Error Handling**: Graceful handling of edge cases

### 📊 **Performance Summary**

| Operation Type  | Ops/Second | Avg Time (ms) | Use Case           |
| --------------- | ---------- | ------------- | ------------------ |
| Simple Objects  | 2,569,159  | 0.0004        | Config, primitives |
| Circular Refs   | 1,641,419  | 0.0006        | Complex structures |
| Functions       | 2,305,586  | 0.0004        | Component cloning  |
| Comprehensive   | 93,373     | 0.0107        | All data types     |
| Complex Objects | 25,396     | 0.0394        | Nested structures  |

### 🚀 **Optimal Use Cases**

- **State Management**: Perfect for Redux/Zustand/Recoil stores
- **API Response Cloning**: Excellent for server data processing
- **Configuration Objects**: Outstanding performance for app settings
- **Form Data Handling**: Efficient user input cloning and validation
- **Caching Systems**: Great for cache invalidation and snapshots
- **Real-time Applications**: Suitable for high-frequency operations

_See [PERFORMANCE_REPORT.md](./PERFORMANCE_REPORT.md) for detailed benchmarks and analysis._

## Technical Notes

- Uses `WeakMap` for efficient circular reference tracking
- Minimizes object creation for primitive types
- Preserves prototype chain without unnecessary copying
- Optimized for common use cases with linear scaling
- Memory-safe implementation with automatic garbage collection

## License

MIT © [Ridwan Olanrewaju](https://github.com/ibnlanre)
