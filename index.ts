export type CloneFunction = <T>(value: T, visited?: WeakMap<object, any>) => T;
export type CloneHandler<T = any> = (
  value: T,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) => T;
export type CloneRegistryModifier = (registry: CloneRegistry) => void;
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Central registry for clone handlers
 */
export class CloneRegistry {
  private handlers = new Map<any, CloneHandler>();

  /**
   * Get handler for a value
   */
  getHandler(value: any): CloneHandler | null {
    const constructor = value?.constructor;
    return this.handlers.get(constructor) ?? null;
  }

  /**
   * Check if a constructor is registered
   */
  hasHandler(constructor: any): boolean {
    return this.handlers.has(constructor);
  }

  /**
   * Register a handler for a specific constructor
   */
  setHandler<T>(constructor: Constructor<T>, handler: CloneHandler<T>) {
    this.handlers.set(constructor, handler);
    return this;
  }
}

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
  ArrayBuffer: (value: ArrayBuffer) => value.slice(),
  Blob: (value: Blob) => new Blob([value], { type: value.type }),
  DataView: (value: DataView) => {
    return new DataView(
      value.buffer.slice(),
      value.byteOffset,
      value.byteLength
    );
  },
  Date: (value: Date) => new Date(value.getTime()),
  Error: (
    value: Error,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ) => {
    const Constructor = value.constructor as ErrorConstructor;
    const result = new Constructor(value.message);
    result.name = value.name;
    if (value.stack) result.stack = value.stack;

    visited.set(value, result);
    const properties = Object.getOwnPropertyNames(value);
    const symbols = Object.getOwnPropertySymbols(value);

    copyProperties(result, properties, value, visited, clone);
    copyProperties(result, symbols, value, visited, clone);

    return result;
  },
  File: (value: File) => {
    const result = new File([value], value.name, {
      lastModified: value.lastModified,
      type: value.type,
    });
    return result;
  },
  FormData: (value: FormData) => {
    const result = new FormData();
    for (const [key, val] of value) {
      result.append(key, val);
    }
    return result;
  },
  Function: (value: Function, visited: WeakMap<object, any>) => {
    const result = createInstance(value);
    Object.assign(result, value);

    if (value.prototype) {
      result.prototype = Object.create(null);
      Object.assign(result.prototype, value.prototype);
      Object.defineProperty(result.prototype, "constructor", {
        configurable: true,
        value: result,
        writable: true,
      });
    }

    visited.set(value, result);
    return result;
  },
  Identity: <T>(value: T) => value,
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
  Object: (value: any, visited: WeakMap<object, any>, clone: CloneFunction) => {
    const result = Object.create(Object.getPrototypeOf(value));
    visited.set(value, result);

    const properties = Object.getOwnPropertyNames(value);
    const symbols = Object.getOwnPropertySymbols(value);

    copyProperties(result, properties, value, visited, clone);
    copyProperties(result, symbols, value, visited, clone);

    return result;
  },
  RegExp: (value: RegExp) => new RegExp(value.source, value.flags),
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
  TypedArray: (value: any) => {
    return new value.constructor(
      value.buffer.slice(),
      value.byteOffset,
      value.length
    );
  },
  URL: (value: URL) => new URL(value.href),
  URLSearchParams: (value: URLSearchParams) => {
    return new URLSearchParams(value);
  },
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
  const registry = createDefaultRegistry();
  if (registryModifier) registryModifier(registry);

  const clone: CloneFunction = <T>(
    value: T,
    visited?: WeakMap<object, any>
  ): T => {
    // Handle primitive values directly
    if (isPrimitive(value)) return value;

    // Initialize visited map
    if (!visited) visited = new WeakMap();

    // Check circular references
    if (visited.has(value as object)) {
      return visited.get(value as object);
    }

    // Try to find a registered handler
    const handler = registry.getHandler(value);
    if (handler) return handler(value, visited, clone);

    // Fallback to generic object handler
    return Handlers.Object(value, visited, clone);
  };

  return clone;
}

/**
 * Copy properties from one object to another
 *
 * @description
 * This function copies properties from the source object to the target object.
 * It handles both regular properties and symbols, and uses the provided clone function
 * to handle circular references.
 *
 * @param result The target object where properties will be copied
 * @param keys The list of property keys to copy
 * @param value The source object from which properties will be copied
 * @param visited A WeakMap to track visited objects for circular references
 * @param clone The clone function to handle cloning of values
 *
 * @returns The target object with copied properties
 */
function copyProperties(
  result: Record<PropertyKey, any>,
  keys: Array<PropertyKey>,
  value: Record<PropertyKey, any>,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) {
  if (!keys.length) return result;

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;

    if (isPropertyAccessor(descriptor, key)) {
      Object.defineProperty(result, key, descriptor);
    } else {
      result[key] = clone(value[key], visited);
    }
  }

  return result;
}

/**
 * Create a default registry with common handlers
 */
function createDefaultRegistry(): CloneRegistry {
  const registry = new CloneRegistry();

  // Register by constructor
  registry
    .setHandler(Date, Handlers.Date)
    .setHandler(RegExp, Handlers.RegExp)
    .setHandler(Array, Handlers.Array)
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
    .setHandler(Function, Handlers.Function)
    .setHandler(Object, Handlers.Object);

  // Register typed-array constructors
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

  // Register weak collections
  const weakCollections: Constructor[] = [WeakMap, WeakSet, WeakRef];

  weakCollections.forEach((Constructor) => {
    registry.setHandler(Constructor, Handlers.Identity);
  });

  return registry;
}

/**
 * Create a new instance of a function with the same prototype
 *
 * @description
 * This function creates a new instance of a function that behaves like a constructor.
 * It checks if the function is called with `new` and applies the original function
 * to the new instance, returning either the instance or the result of the function.
 *
 * @param value The function to create an instance of
 * @returns A new function that behaves like a constructor
 */
function createInstance<T extends Function>(value: T) {
  const result = function (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);
      const method = value.apply(instance, args);
      return isNonObject(method) ? instance : method;
    }
    return value.apply(this, args);
  };

  return result;
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
function isPropertyAccessor(descriptor: PropertyDescriptor, key: PropertyKey) {
  return (
    descriptor.get ||
    descriptor.set ||
    !descriptor.enumerable ||
    !descriptor.configurable ||
    !descriptor.writable ||
    key === "__proto__"
  );
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
