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

The library provides powerful customization capabilities through `createCloneFunction` and the registry system. This allows you to handle custom types or modify existing behavior.

#### Type Validation System

Validators provide an additional layer of type safety when cloning objects. They ensure that values are of the expected type before applying the corresponding clone handler.

```javascript
import { createCloneFunction, Validators } from "@ibnlanre/clone";

// Create custom validators
const customValidators = {
  // Validate a specific custom class
  MyClass: (value) => value instanceof MyClass && value.isValid,

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

const clone = createCloneFunction((registry) => {
  // Register handler with custom validator
  registry.setHandler(
    MyClass,
    (value, visited, clone) => {
      /* handler logic */
    },
    customValidators.MyClass
  );

  // Use built-in validators
  registry.setHandler(MyFunction, Handlers.Function, Validators.Function);
});
```

**Benefits of Using Validators:**

- **Type Safety**: Ensure values match expected types before cloning
- **Error Prevention**: Catch type mismatches early in the cloning process
- **Debugging**: Better error messages when validation fails
- **Performance**: Skip inappropriate handlers for better performance

#### Basic Custom Function

```javascript
import { createCloneFunction } from "@ibnlanre/clone";

// Create a custom clone function
const customClone = createCloneFunction();

// Use it like the default clone
const cloned = customClone(originalObject);
```

#### Adding Custom Type Handlers

```javascript
import {
  createCloneFunction,
  CloneRegistry,
  Validators,
} from "@ibnlanre/clone";

// Define a custom class
class MyCustomType {
  constructor(data) {
    this.data = data;
    this.timestamp = Date.now();
  }
}

// Create a custom clone function with registry modifier
const customClone = createCloneFunction((registry) => {
  registry.setHandler(
    MyCustomType,
    (value, visited, clone) => {
      // Custom cloning logic for MyCustomType
      const result = new MyCustomType(clone(value.data, visited));

      result.timestamp = value.timestamp; // Preserve original timestamp
      visited.set(value, result);

      return result;
    },
    // Optional validator to ensure type safety
    (value) => value instanceof MyCustomType
  );
});

// Now MyCustomType instances are cloned with custom logic
const original = new MyCustomType({ nested: { value: 42 } });
const cloned = customClone(original);
```

#### Registry System API

The `CloneRegistry` class provides methods to manage type handlers:

```javascript
import { CloneRegistry, Handlers, Validators } from "@ibnlanre/clone";

const registry = new CloneRegistry();

// Check if a handler exists
if (registry.hasHandler(MyCustomType)) {
  console.log("Handler exists");
}

// Set a custom handler with validator
registry.setHandler(
  MyCustomType,
  Handlers.Identity, // Use identity handler
  Validators.Object // Use built-in object validator
);

// Set a custom handler with custom validator
registry.setHandler(
  MySpecialType,
  (value, visited, clone) => {
    /* custom logic */
  },
  (value) => value instanceof MySpecialType && value.isValid
);

// Get a handler for a value
const [handler, validator] = registry.getHandler(someValue);
```

#### Built-in Handlers and Validators

The library exports pre-built handlers and validators you can reuse:

```javascript
import { createCloneFunction, Handlers, Validators } from "@ibnlanre/clone";

const customClone = createCloneFunction((registry) => {
  // Use identity handler for custom types (no cloning)
  registry.setHandler(MyImmutableType, Handlers.Identity);

  // Use object handler for plain object-like types
  registry.setHandler(MyPlainObjectType, Handlers.Object);

  // Use array handler for array-like types with array validator
  registry.setHandler(MyArrayLikeType, Handlers.Array, Validators.Array);

  // Use function handler with function validator
  registry.setHandler(MyCallableType, Handlers.Function, Validators.Function);
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

#### Complex Custom Handler Example

```javascript
import { createCloneFunction, Validators } from "@ibnlanre/clone";

class DatabaseModel {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this._metadata = { created: Date.now() };
  }
}

const dbClone = createCloneFunction((registry) => {
  registry.setHandler(
    DatabaseModel,
    (value, visited, clone) => {
      // Create new instance with cloned data but preserve ID
      const result = new DatabaseModel(
        value.id, // Keep original ID
        clone(value.data, visited) // Deep clone data
      );

      // Clone metadata separately
      result._metadata = clone(value._metadata, visited);
      visited.set(value, result);

      return result;
    },
    // Custom validator that checks instance and data validity
    (value) => {
      return (
        value instanceof DatabaseModel && value.id != null && value.data != null
      );
    }
  );
});

// Usage
const original = new DatabaseModel("user_123", {
  name: "Alice",
  preferences: { theme: "dark" },
});

const cloned = dbClone(original);
// cloned.id === original.id (preserved)
// cloned.data !== original.data (deep cloned)
```

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

#### Extending Existing Types

You can override handlers for built-in types:

```javascript
const customClone = createCloneFunction((registry) => {
  // Custom Date handler that rounds to nearest second
  registry.setHandler(
    Date,
    (value) => {
      const rounded = new Date(Math.round(value.getTime() / 1000) * 1000);
      return rounded;
    },
    Validators.Date // Use built-in Date validator
  );

  // Custom Array handler that filters out null values
  registry.setHandler(
    Array,
    (value, visited, clone) => {
      const result = [];
      visited.set(value, result);

      for (let i = 0; i < value.length; i++) {
        if (i in value && value[i] !== null) {
          result[i] = clone(value[i], visited);
        }
      }

      return result;
    },
    Validators.Array // Use built-in Array validator
  );
});
```

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
