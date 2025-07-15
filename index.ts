export type CloneFunction = <Value = any>(
  value: Value,
  visited?: WeakMap<object, any>
) => Value;
export type CloneHandler<Value = any, Result = Value> = (
  value: Value,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) => Result;
export type CloneRegistryModifier = (registry: CloneRegistry) => void;
export type CloneValidator = (value: any) => boolean;
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Clone handler registry
 *
 * @description
 * Manages clone handlers mapped to constructors. Enables registration and lookup of handlers for specific types,
 * allowing the clone function to deeply copy objects while maintaining their structure and properties.
 */
export class CloneRegistry {
  private handlers: WeakMap<any, CloneHandler> = new WeakMap();
  private validators: WeakMap<any, CloneValidator> = new WeakMap();

  /**
   * Get a clone handler for a specific value
   *
   * @description
   * This method retrieves the appropriate clone handler for the given value based on its constructor.
   * If no handler is found, it returns null. If no validator is found, it returns true.
   *
   * @param value The value for which to get the handler
   * @returns The clone handler for the value or null if not found
   */
  getHandler(value: any): [CloneHandler | null, CloneValidator] {
    const constructor = getConstructor(value);

    return [
      this.handlers.get(constructor) ?? null,
      this.validators.get(constructor) ?? (() => true),
    ];
  }

  /**
   * Check if a constructor is registered
   *
   * @description
   * This method checks if a handler is registered for the given constructor.
   * It returns true if a handler exists, false otherwise.
   *
   * @param constructor The constructor to check for a registered handler
   * @returns True if a handler is registered, false otherwise
   */
  hasHandler(constructor: any): boolean {
    return this.handlers.has(constructor);
  }

  /**
   * Register a handler for a specific constructor
   *
   * @description
   * This method registers a clone handler and a validator function for the specified constructor.
   * It allows the clone function to use the handler when cloning instances of that constructor.
   * The validator is used to check if a value is of the expected type before cloning.
   *
   * @param constructor The constructor for which to register the handler
   * @param handler The clone handler to register
   * @param validator The validator function to register
   *
   * @returns The CloneRegistry instance for method chaining
   */
  setHandler<T>(
    constructor: Constructor<T> | Function,
    handler: CloneHandler<T>,
    validator?: CloneValidator
  ) {
    this.handlers.set(constructor, handler);

    if (validator) {
      this.validators.set(constructor, validator);
    }

    return this;
  }
}

/**
 * Pre-built validators for common types
 *
 * @description
 * This object contains methods that validate if a value is of a specific type.
 * These validators are used by the clone function to ensure that values are of the expected type before cloning.
 */
export const Validators = {
  /**
   * Validates if the result is an array
   *
   * @param result The value to validate
   * @returns True if the value is an array, false otherwise
   */
  Array: (result: any): result is any[] => {
    return Array.isArray(result);
  },

  /**
   * Validates if the result is an ArrayBuffer
   *
   * @param result The value to validate
   * @returns True if the value is an ArrayBuffer, false otherwise
   */
  AsyncFunction: (result: any): result is Function => {
    return (
      typeof result === "function" &&
      result.constructor.name === "AsyncFunction"
    );
  },

  /**
   * Validates if the result is an AsyncGeneratorFunction
   *
   * @param result The value to validate
   * @returns True if the value is an AsyncGeneratorFunction, false otherwise
   */
  AsyncGeneratorFunction: (result: any): result is Function => {
    return (
      typeof result === "function" &&
      result.constructor.name === "AsyncGeneratorFunction"
    );
  },

  /**
   * Validates if the result is a Date object
   *
   * @param result The value to validate
   * @returns True if the value is a Date object, false otherwise
   */
  Date: (result: any): result is Date => {
    return result instanceof Date && !isNaN(result.getTime());
  },

  /**
   * Validates if the result is a Function
   *
   * @param result The value to validate
   * @returns True if the value is a Function, false otherwise
   */
  Function: (result: any): result is Function => {
    return typeof result === "function";
  },

  /**
   * Validates if the result is a GeneratorFunction
   *
   * @param result The value to validate
   * @returns True if the value is a GeneratorFunction, false otherwise
   */
  GeneratorFunction: (result: any): result is Function => {
    return (
      typeof result === "function" &&
      result.constructor.name === "GeneratorFunction"
    );
  },

  /**
   * Validates if the result is an object
   *
   * @param result The value to validate
   * @returns True if the value is an object, false otherwise
   */
  Object: (result: any): result is object => {
    return result !== null && typeof result === "object";
  },
};

/**
 * Pre-built handlers for common types
 *
 * @description
 * This object contains methods that handle cloning for various types.
 * Each method takes a value, a WeakMap to track visited objects, and the clone function
 * itself to handle circular references. These handlers are used by the clone function
 * to create deep copies of complex objects while preserving their structure and properties.
 */
export const Handlers = {
  /**
   * Clones an array by iterating over its items and cloning each one.
   * It uses a WeakMap to track visited objects to handle circular references.
   *
   * @param value The array to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new array containing cloned items
   */
  Array: <T>(
    value: T[],
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ): T[] => {
    const length = value.length;
    const result = new Array(length);
    visited.set(value, result);

    for (let key = 0; key < length; key++) {
      if (key in value) {
        result[key] = clone(value[key], visited);
      }
    }

    return result;
  },

  /**
   * Clones an ArrayBuffer by creating a new instance with the same byte data.
   *
   * @param value The ArrayBuffer to clone
   * @returns A new ArrayBuffer with the same data
   */
  ArrayBuffer: (value: ArrayBuffer) => value.slice(),

  /**
   * Clones an async function by creating a new instance that behaves like a constructor.
   * It copies properties from the original function to the new instance.
   *
   * @param value The async function to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new async function that behaves like a constructor
   */
  AsyncFunction: (value: Function) => createAsyncInstance(value as any),

  /**
   * Clones an async generator function by creating a new instance that behaves like an async generator.
   * It copies properties from the original function to the new instance.
   *
   * @param value The async generator function to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new async generator function that behaves like a constructor
   */
  AsyncGeneratorFunction: (value: Function) => {
    const result = createAsyncGeneratorInstance(
      value as AsyncGeneratorFunction
    );
    return result;
  },

  Blob: (value: Blob) => new Blob([value], { type: value.type }),

  /**
   * Clones a DataView by creating a new instance with the same buffer, byteOffset, and byteLength.
   *
   * @param value The DataView to clone
   * @returns A new DataView with the same data
   */
  DataView: (value: DataView) => {
    return new DataView(
      value.buffer.slice(),
      value.byteOffset,
      value.byteLength
    );
  },

  /**
   * Clones a Date by creating a new instance with the same time value.
   *
   * @param value The Date to clone
   * @returns A new Date with the same time value
   */
  Date: (value: Date) => new Date(value.getTime()),

  /**
   * Clones an Error by creating a new instance with the same message and name.
   * It also copies properties from the original error to the new instance.
   *
   * @param value The Error to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new Error with the same message and properties
   */
  Error: (value: Error) => {
    const Constructor = value.constructor as ErrorConstructor;
    const result = new Constructor(value.message);
    result.name = value.name;

    if (value.stack) result.stack = value.stack;
    return result;
  },

  /**
   * Clones a File by creating a new instance with the same name, lastModified, and type.
   *
   * @param value The File to clone
   * @returns A new File with the same properties
   */
  File: (value: File) => {
    const result = new File([value], value.name, {
      lastModified: value.lastModified,
      type: value.type,
    });
    return result;
  },

  /**
   * Clones a FormData by creating a new instance and appending all key-value pairs.
   *
   * @param value The FormData to clone
   * @returns A new FormData with the same key-value pairs
   */
  FormData: (value: FormData) => {
    const result = new FormData();

    value.forEach((item, key) => {
      result.append(key, item);
    });

    return result;
  },

  /**
   * Clones a function by creating a new instance that behaves like a constructor.
   * It copies properties from the original function to the new instance.
   *
   * @param value The function to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new function that behaves like a constructor
   */
  Function: (value: Function) => createInstance(value),

  /**
   * Clones a generator function by creating a new instance that behaves like a generator.
   * It copies properties from the original function to the new instance.
   *
   * @param value The generator function to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new generator function that behaves like a constructor
   */
  GeneratorFunction: (value: Function) => {
    return createGeneratorInstance(value as GeneratorFunction);
  },

  /**
   * Identity handler that returns the value as is.
   * Used for types that do not require deep cloning, such as WeakMap, WeakSet, and WeakRef.
   *
   * @param value The value to return
   * @returns The same value
   */
  Identity: <T>(value: T) => value,

  /**
   * Clones a Map by iterating over its items and cloning each key-value pair.
   * It uses a WeakMap to track visited objects to handle circular references.
   *
   * @param value The Map to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new Map containing cloned items
   */
  Map: <K, V>(
    value: Map<K, V>,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ): Map<K, V> => {
    const result = new Map<K, V>();
    visited.set(value, result);

    value.forEach((item, key) => {
      result.set(clone(key, visited), clone(item, visited));
    });

    return result;
  },

  /**
   * Clones an object by creating a new instance and copying properties from the original object.
   * It uses a WeakMap to track visited objects to handle circular references.
   *
   * @param value The object to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new object with the same properties
   */
  Object: (value: any) => Object.create(Object.getPrototypeOf(value)),

  /**
   * Clones a Promise by creating a new Promise that resolves with the cloned value.
   * It uses a WeakMap to track visited objects to handle circular references.
   *
   * @param value The Promise to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new Promise that resolves with the cloned value
   */
  Promise: (
    value: Promise<any>,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ): Promise<any> => {
    const result = new Promise((resolve, reject) => {
      value.then(
        (resolved) => resolve(clone(resolved, visited)),
        (error) => reject(clone(error, visited))
      );
    });

    return result;
  },

  /**
   * Clones a RegExp by creating a new instance with the same source and flags.
   *
   * @param value The RegExp to clone
   * @returns A new RegExp with the same source and flags
   */
  RegExp: (value: RegExp) => new RegExp(value.source, value.flags),

  /**
   * Clones a Set by iterating over its items and cloning each one.
   * It uses a WeakMap to track visited objects to handle circular references.
   *
   * @param value The Set to clone
   * @param visited A WeakMap to track visited objects
   * @param clone The clone function to handle cloning of values
   * @returns A new Set containing cloned items
   */
  Set: <T>(
    value: Set<T>,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ): Set<T> => {
    const result = new Set<T>();
    visited.set(value, result);

    value.forEach((item) => {
      result.add(clone(item, visited));
    });

    return result;
  },

  /**
   * Clones a TypedArray by creating a new instance with the same buffer, byteOffset, and length.
   *
   * @param value The TypedArray to clone
   * @returns A new TypedArray with the same data
   */
  TypedArray: (value: any) => {
    return new value.constructor(
      value.buffer.slice(),
      value.byteOffset,
      value.length
    );
  },

  /**
   * Clones a URL by creating a new instance with the same href.
   *
   * @param value The URL to clone
   * @returns A new URL with the same href
   */
  URL: (value: URL) => new URL(value.href),

  /**
   * Clones a URLSearchParams by creating a new instance with the same query parameters.
   *
   * @param value The URLSearchParams to clone
   * @returns A new URLSearchParams with the same query parameters
   */
  URLSearchParams: (value: URLSearchParams) => new URLSearchParams(value),
};

/**
 * Creates a new clone function with a customizable registry
 *
 * @description
 * This function creates a new clone function that uses the provided registry modifier
 * to customize the default registry. It handles circular references using a WeakMap
 * and applies the appropriate clone handler based on the value's constructor.
 * If no handler is found, it falls back to the generic object handler.
 *
 * @param registryModifier Optional function to modify the default registry
 * @returns A clone function that can be used to deep clone objects
 *
 * @example
 *
 * ```ts
 * import { createCloneFunction } from '@ibnlanre/clone';
 *
 * // Custom registry modifier to add a new handler
 * const customRegistryModifier: CloneRegistryHandler = (registry) => {
 *   registry.setHandler(MyCustomType, (value, visited, clone) => {
 *     // Custom cloning logic for MyCustomType
 *     const result = new MyCustomType(value.prop);
 *     visited.set(value, result);
 *     return result;
 *   });
 * };
 *
 * // Create a clone function with the custom registry
 * const clone = createCloneFunction(customRegistryModifier);
 * ```
 */
export function createCloneFunction(
  registryModifier?: CloneRegistryModifier
): CloneFunction {
  const registry = new CloneRegistry();

  if (registryModifier) registryModifier(registry);
  else createDefaultRegistry(registry);

  const clone: CloneFunction = <T>(
    value: T,
    visited?: WeakMap<object, any>
  ): T => {
    if (isPrimitive(value)) return value;

    if (!visited) visited = new WeakMap();

    if (visited.has(value as object)) {
      return visited.get(value as object);
    }

    const [handler, validator] = registry.getHandler(value);

    if (handler) {
      const result = handler(value, visited, clone);
      copyProperties(result, value, visited, clone);

      if (validator(result)) return result;
    }

    return value;
  };

  return clone;
}

/**
 * Create a new async generator instance that behaves like an async generator function
 *
 * @description
 * This function creates a new async generator instance that can be used as an async generator function.
 * The original function is called directly to preserve its lexical scope and closure variables.
 * The function maintains proper constructor behavior while ensuring all closure variables
 * captured in the original function remain accessible.
 *
 * @param value The async generator function to create an instance of
 * @returns A new async generator function that behaves like a constructor with preserved closures
 */
function createAsyncGeneratorInstance<T extends AsyncGeneratorFunction>(
  value: T
) {
  const result = async function* (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);

      // Call the original function directly to preserve its closure
      const generator = value.apply(instance, args);

      if (generator && typeof generator.next === "function") {
        yield* generator;
      } else {
        return isNonObject(generator) ? instance : generator;
      }
    } else {
      // Call the original function directly to preserve its closure
      yield* value.apply(this, args);
    }
  };

  return result;
}

/**
 * Create a new async instance of a function with the same prototype
 *
 * @description
 * This function creates a new async instance of a function that behaves like a constructor.
 * The original function is called directly to preserve its lexical scope and closure variables.
 * The function maintains proper constructor behavior while ensuring all closure variables
 * captured in the original function remain accessible.
 *
 * @param value The async function to create an instance of
 * @returns A new async function that behaves like a constructor with preserved closures
 */
function createAsyncInstance<T extends (...args: any[]) => Promise<any>>(
  value: T
) {
  const result = async function (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);

      // Call the original function directly to preserve its closure
      const method = await value.apply(instance, args);

      return isNonObject(method) ? instance : method;
    }
    // Call the original function directly to preserve its closure
    return await value.apply(this, args);
  };

  return result;
}

/**
 * Create a default registry with common handlers
 *
 * @description
 * This function creates a new clone registry and registers handlers for common types
 * such as Date, RegExp, Array, Map, Set, and others. It also registers function constructors
 * and typed array constructors to handle cloning of these types.
 *
 * @returns A new CloneRegistry instance with default handlers registered
 */
function createDefaultRegistry(registry: CloneRegistry) {
  registry
    .setHandler(Date, Handlers.Date, Validators.Date)
    .setHandler(RegExp, Handlers.RegExp)
    .setHandler(Array, Handlers.Array, Validators.Array)
    .setHandler(Map, Handlers.Map)
    .setHandler(Set, Handlers.Set)
    .setHandler(ArrayBuffer, Handlers.ArrayBuffer)
    .setHandler(DataView, Handlers.DataView)
    .setHandler(Error, Handlers.Error)
    .setHandler(URL, Handlers.URL)
    .setHandler(URLSearchParams, Handlers.URLSearchParams)
    .setHandler(FormData, Handlers.FormData)
    .setHandler(Blob, Handlers.Blob)
    .setHandler(File, Handlers.File)
    .setHandler(Object, Handlers.Object)
    .setHandler(Proxy, Handlers.Identity);

  registerFunctionConstructors(registry);
  registerTypedArrayConstructors(registry);
  registerWeakCollections(registry);

  return registry;
}

/**
 * Create a new generator instance that behaves like a generator function
 *
 * @description
 * This function creates a new generator instance that can be used as a generator function.
 * The original function is called directly to preserve its lexical scope and closure variables.
 * The function maintains proper constructor behavior while ensuring all closure variables
 * captured in the original function remain accessible.
 *
 * @param value The generator function to create an instance of
 * @returns A new generator function that behaves like a constructor with preserved closures
 */
function createGeneratorInstance<T extends GeneratorFunction>(value: T) {
  const result = function* (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);

      // Call the original function directly to preserve its closure
      const generator = value.apply(instance, args);

      if (generator && typeof generator.next === "function") {
        yield* generator;
      } else {
        return isNonObject(generator) ? instance : generator;
      }
    } else {
      // Call the original function directly to preserve its closure
      yield* value.apply(this, args);
    }
  };

  return result;
}

/**
 * Create a new instance of a function with the same prototype
 *
 * @description
 * This function creates a new instance of a function that behaves like a constructor.
 * The original function is called directly to preserve its lexical scope and closure variables.
 * The function maintains proper constructor behavior while ensuring all closure variables
 * captured in the original function remain accessible.
 *
 * @param value The function to create an instance of
 * @returns A new function that behaves like a constructor with preserved closures
 */
function createInstance<T extends Function>(value: T) {
  const result = function (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);

      // Call the original function directly to preserve its closure
      const method = value.apply(instance, args);

      return isNonObject(method) ? instance : method;
    }

    // Call the original function directly to preserve its closure
    return value.apply(this, args);
  };

  return result;
}

/**
 * Get the constructor of a value
 *
 * @description
 * This function retrieves the constructor of the provided value.
 * It uses `Object.getPrototypeOf` to get the prototype and then accesses the `constructor` property.
 *
 * @param value The value for which to get the constructor
 * @returns The constructor function of the value
 */
function getConstructor<T>(value: T): Function {
  return Object.getPrototypeOf(value).constructor;
}

/**
 * Check if a type is not an object or function
 *
 * @description
 * This function checks if the provided type is neither an object nor a function.
 * It returns true for primitive types (null, undefined, string, number, boolean, symbol, bigint)
 * and false for objects and functions.
 *
 * @param type The type to check
 * @returns True if the type is not an object or function, false otherwise
 */
function isNonObject<T>(type: T) {
  return type !== "object" && type !== "function";
}

/**
 * Check if a value is a primitive type
 *
 * @description
 * This function checks if the provided value is a primitive type (null, undefined, string, number, boolean, symbol, or bigint).
 * It returns true for these types and false for objects and functions.
 *
 * @param value The value to check
 * @returns True if the value is a primitive type, false otherwise
 */
function isPrimitive<T>(value: T) {
  if (value === null || value === undefined) return true;
  return isNonObject(typeof value);
}

/**
 * Check if a property descriptor indicates a property accessor
 *
 * @description
 * This function checks if the provided property descriptor indicates that the property is an accessor (getter/setter)
 * or has specific characteristics that make it non-enumerable, non-configurable, or non-writable.
 *
 * @param descriptor The property descriptor to check
 * @param key The property key being checked
 *
 * @returns True if the descriptor indicates a property accessor, false otherwise
 */
function isPropertyAccessor(descriptor: PropertyDescriptor) {
  return (
    descriptor.get ||
    descriptor.set ||
    !descriptor.enumerable ||
    !descriptor.configurable ||
    !descriptor.writable
  );
}

/**
 * Get all function constructor types
 *
 * @description
 * This function dynamically retrieves constructors for different function types
 * including AsyncFunction, GeneratorFunction, and AsyncGeneratorFunction.
 * These constructors are not globally available, so we get them from instances.
 *
 * @returns Array of function constructors
 */
function registerFunctionConstructors(registry: CloneRegistry) {
  registry.setHandler(Function, Handlers.Function, Validators.Function);
  registry.setHandler(Promise, Handlers.Promise);

  const AsyncFunction = getConstructor(async function () {});
  registry.setHandler(
    AsyncFunction,
    Handlers.AsyncFunction,
    Validators.AsyncFunction
  );

  const GeneratorFunction = getConstructor(function* () {});
  registry.setHandler(
    GeneratorFunction,
    Handlers.GeneratorFunction,
    Validators.GeneratorFunction
  );

  const AsyncGeneratorFunction = getConstructor(async function* () {});
  registry.setHandler(
    AsyncGeneratorFunction,
    Handlers.AsyncGeneratorFunction,
    Validators.AsyncGeneratorFunction
  );
}

/**
 * Register handlers for typed array constructors
 *
 * @description
 * This function registers handlers for all typed array constructors in the clone registry.
 * It uses the TypedArray handler to handle cloning of typed arrays.
 *
 * @param registry The clone registry to register the handlers in
 */
function registerTypedArrayConstructors(registry: CloneRegistry) {
  const typedArrays = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  ];

  typedArrays.forEach((Constructor) => {
    registry.setHandler(Constructor, Handlers.TypedArray);
  });
}

/**
 * Register handlers for weak collections
 *
 * @description
 * This function registers handlers for WeakMap, WeakSet, and WeakRef in the clone registry.
 * These handlers use the Identity handler since weak collections do not need deep cloning.
 *
 * @param registry The clone registry to register the handlers in
 */
function registerWeakCollections(registry: CloneRegistry) {
  const weakCollections: Constructor[] = [WeakMap, WeakSet, WeakRef];

  weakCollections.forEach((Constructor) => {
    registry.setHandler(Constructor, Handlers.Identity);
  });
}

/**
 * Creates a deep clone of a value using the default registry.
 *
 * @param value The value to clone.
 * @param visited A WeakMap to track visited objects to prevent circular references.
 *
 * @returns The cloned value.
 */
const clone = createCloneFunction();
export default clone;

/**
 * Copy properties from one object to another
 *
 * @description
 * This function copies properties from the source object to the target object.
 * It handles both regular properties and symbols, and uses the provided clone function
 * to handle circular references.
 *
 * @param result The target object where properties will be copied
 * @param value The source object from which properties will be copied
 * @param visited A WeakMap to track visited objects for circular references
 * @param clone The clone function to handle cloning of values
 *
 * @returns The target object with copied properties
 */
export function copyProperties(
  result: any,
  value: any,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) {
  visited.set(value, result);

  if (!Object.isExtensible(result)) return result;

  const properties = Object.getOwnPropertyNames(value);
  if (properties.length) {
    for (let index = 0; index < properties.length; index++) {
      const key = properties[index];

      if (typeof value === "function") {
        if (
          key === "constructor" ||
          key === "name" ||
          key === "length" ||
          key === "arguments" ||
          key === "caller" ||
          key === "callee"
        ) {
          continue;
        }
      }

      if (key === "prototype" || key === "__proto__") {
        Object.assign(result[key], value[key]);
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor) {
        if (isPropertyAccessor(descriptor)) {
          Object.defineProperty(result, key, descriptor);
        } else {
          result[key] = clone(value[key], visited);
        }
      }
    }
  }

  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.length) {
    for (let index = 0; index < symbols.length; index++) {
      const key = symbols[index];

      if (
        key === Symbol.iterator ||
        key === Symbol.toStringTag ||
        key === Symbol.species ||
        key === Symbol.unscopables ||
        key === Symbol.asyncIterator ||
        key === Symbol.match ||
        key === Symbol.replace ||
        key === Symbol.search ||
        key === Symbol.split ||
        key === Symbol.hasInstance ||
        key === Symbol.isConcatSpreadable ||
        key === Symbol.toPrimitive ||
        key === Symbol.matchAll ||
        key === Symbol.metadata ||
        key === Symbol.dispose ||
        key === Symbol.asyncDispose
      ) {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor) {
        if (isPropertyAccessor(descriptor)) {
          Object.defineProperty(result, key, descriptor);
        } else {
          result[key] = clone(descriptor.value, visited);
        }
      }
    }
  }

  return result;
}
