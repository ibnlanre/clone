export type CloneFunction = <T>(value: T, visited?: WeakMap<object, any>) => T;
export type CloneHandler<T = any> = (
  value: T,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) => T;
export type CloneRegistryModifier = (registry: CloneRegistry) => void;
export type Constructor<T = any> = new (...args: any[]) => T;
export type Subject<T = any> = Record<PropertyKey, T>;

/**
 * Clone handler registry
 *
 * @description
 * Manages clone handlers mapped to constructors. Enables registration and lookup of handlers for specific types,
 * allowing the clone function to deeply copy objects while maintaining their structure and properties.
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
  setHandler<T>(
    constructor: Constructor<T> | Function,
    handler: CloneHandler<T>
  ) {
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
  AsyncFunction: (
    value: Function,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ) => {
    const result = createAsyncInstance(value as any);
    return cloneFunctionProperties(value, result, visited, clone);
  },
  AsyncGeneratorFunction: (
    value: Function,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ) => {
    const result = createAsyncGeneratorInstance(
      value as AsyncGeneratorFunction
    );
    return cloneFunctionProperties(value, result, visited, clone);
  },

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
    copyProperties(result, value, visited, clone);
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
  Function: (
    value: Function,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ) => {
    const result = createInstance(value);
    return cloneFunctionProperties(value, result, visited, clone);
  },
  GeneratorFunction: (
    value: Function,
    visited: WeakMap<object, any>,
    clone: CloneFunction
  ) => {
    const result = createGeneratorInstance(value as GeneratorFunction);
    return cloneFunctionProperties(value, result, visited, clone);
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
    copyProperties(result, value, visited, clone);
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
 * @param value The source object from which properties will be copied
 * @param visited A WeakMap to track visited objects for circular references
 * @param clone The clone function to handle cloning of values
 *
 * @returns The target object with copied properties
 */
function copyProperties(
  result: Subject,
  value: Subject,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) {
  visited.set(value, result);

  function enumerate<Keys extends PropertyKey[]>(keys: Keys) {
    if (!keys.length) return;

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];

      if (key === "prototype") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor) {
        if (isPropertyAccessor(descriptor, key)) {
          Object.defineProperty(result, key, descriptor);
        } else {
          result[key] = clone(value[key], visited);
        }
      }
    }
  }

  const symbols = Object.getOwnPropertySymbols(value);
  const properties = Object.getOwnPropertyNames(value);

  enumerate(properties);
  enumerate(symbols);
}

/**
 * Create a new async generator instance that behaves like an async generator function
 *
 * @description
 * This function creates a new async generator instance that can be used as an async generator function.
 * It checks if the function is called with `new` and applies the original function to the new instance,
 * yielding values from the async generator or returning the instance if it's not an async generator.
 *
 * @param value The async generator function to create an instance of
 * @returns A new async generator function that behaves like a constructor
 */
function createAsyncGeneratorInstance<T extends AsyncGeneratorFunction>(
  value: T
) {
  const result = async function* (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);
      const generator = value.apply(instance, args);

      if (generator && typeof generator.next === "function") {
        yield* generator;
      } else {
        return isNonObject(generator) ? instance : generator;
      }
    } else {
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
 * It checks if the function is called with `new` and applies the original function
 * to the new instance, returning either the instance or the result of the function.
 *
 * @param value The async function to create an instance of
 * @returns A new async function that behaves like a constructor
 */
function createAsyncInstance<T extends (...args: any[]) => Promise<any>>(
  value: T
) {
  const result = async function (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);
      const method = await value.apply(instance, args);
      return isNonObject(method) ? instance : method;
    }
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
function createDefaultRegistry(): CloneRegistry {
  const registry = new CloneRegistry();

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
    .setHandler(Object, Handlers.Object);

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
 * It checks if the function is called with `new` and applies the original function to the new instance,
 * yielding values from the generator or returning the instance if it's not a generator.
 *
 * @param value The generator function to create an instance of
 * @returns A new generator function that behaves like a constructor
 */
function createGeneratorInstance<T extends GeneratorFunction>(value: T) {
  const result = function* (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(result.prototype);
      const generator = value.apply(instance, args);

      if (generator && typeof generator.next === "function") {
        yield* generator;
      } else {
        return isNonObject(generator) ? instance : generator;
      }
    } else {
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
 * Clone properties of a function, including its prototype
 *
 * @description
 * This function copies properties from the original function to the new function,
 * including the prototype if it exists. It also sets the constructor property
 * on the prototype to point back to the new function.
 *
 * @param value The original function to clone
 * @param result The new function instance that will receive the properties
 * @param visited A WeakMap to track visited objects for circular references
 * @param clone The clone function to handle cloning of values
 *
 * @returns The new function with cloned properties
 */
const cloneFunctionProperties = (
  value: Function,
  result: Function,
  visited: WeakMap<object, any>,
  clone: CloneFunction
) => {
  Object.assign(result, value);

  if (value.prototype) {
    Object.assign(result.prototype, value.prototype);
  }

  copyProperties(result, value, visited, clone);
  return result;
};

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
  registry.setHandler(Function, Handlers.Function);

  const AsyncFunction = async function () {}.constructor;
  registry.setHandler(AsyncFunction, Handlers.AsyncFunction);

  const GeneratorFunction = function* () {}.constructor;
  registry.setHandler(GeneratorFunction, Handlers.GeneratorFunction);

  const AsyncGeneratorFunction = async function* () {}.constructor;
  registry.setHandler(AsyncGeneratorFunction, Handlers.AsyncGeneratorFunction);
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
