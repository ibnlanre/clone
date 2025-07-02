export type Dictionary = Record<PropertyKey, unknown>;
export type GenericObject = { [key: string]: any };

/**
 * Check if the value is a dictionary.
 *
 * @param value The value to check.
 *
 * @returns A boolean indicating whether the value is a dictionary.
 */
export function isDictionary(value: unknown): value is Dictionary {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Check if the value is a plain object.
 *
 * @param value The value to check.
 * @returns A boolean indicating whether the value is a plain object.
 */
function isObject(value: unknown): value is GenericObject {
  return typeof value === "object" && value !== null;
}

/**
 * Clone a function while preserving its properties.
 * The cloned function will have the same properties as the original.
 *
 * @param fn - The function to clone
 * @returns A new function that is a clone of the original
 */
const cloneFunction = (fn: Function) => {
  return Object.assign(fn.bind(null), fn);
};

/**
 * Create a deep clone of any value
 * Preserves prototypes for plain objects and handles:
 * - Primitives
 * - Date objects
 * - RegExp objects
 * - Map objects (keys and values are deep cloned)
 * - Set objects (values are deep cloned)
 * - ArrayBuffer objects
 * - Typed arrays (Int8Array, Uint8Array, etc.)
 * - DataView objects
 * - Error objects (including custom properties)
 * - URL objects
 * - URLSearchParams objects
 * - Arrays
 * - Plain objects (preserving prototype)
 * - Cyclic references
 * - Other objects (shallow copy)
 *
 * @param value - The value to clone
 * @param visited - WeakMap tracking already processed objects to handle cyclic references
 *
 * @returns A new cloned value
 */
export function createSnapshot<T>(value: T, visited = new WeakMap()): T {
  if (typeof value === "function") {
    const clone = cloneFunction(value);
    visited.set(value, clone);
    return clone as T;
  }

  if (!isObject(value)) return value;

  if (visited.has(value)) return visited.get(value);

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  if (value instanceof Map) {
    const clone = new Map();
    visited.set(value, clone);

    value.forEach((val, key) => {
      clone.set(createSnapshot(key, visited), createSnapshot(val, visited));
    });

    return clone as T;
  }

  if (value instanceof Set) {
    const clone = new Set();
    visited.set(value, clone);

    value.forEach((val) => {
      clone.add(createSnapshot(val, visited));
    });

    return clone as T;
  }

  if (value instanceof ArrayBuffer) {
    return value.slice(0) as T;
  }

  if (ArrayBuffer.isView(value)) {
    const buffer = value.buffer.slice(0);

    if (value instanceof DataView) {
      return new DataView(buffer, value.byteOffset, value.byteLength) as T;
    }

    const Constructor = value.constructor as any;
    return new Constructor(buffer, value.byteOffset, value.length) as T;
  }

  if (value instanceof Error) {
    const Constructor = value.constructor as ErrorConstructor;
    const clone = new Constructor(value.message);

    clone.name = value.name;
    clone.stack = value.stack;
    visited.set(value, clone);

    for (const key of Object.getOwnPropertyNames(value)) {
      if (["message", "name", "stack"].includes(key)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor) {
        Object.defineProperty(clone, key, {
          ...descriptor,
          value: createSnapshot(descriptor.value, visited),
        });
      }
    }

    return clone as T;
  }

  if (value instanceof URL) {
    return new URL(value.href) as T;
  }

  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value.toString()) as T;
  }

  if (Array.isArray(value)) {
    const clone = [] as typeof value;

    visited.set(value, clone);

    value.forEach((item, index) => {
      clone[index] = createSnapshot(item, visited);
    });

    return clone as T;
  }

  if (isDictionary(value)) {
    const result = Object.create(
      Object.getPrototypeOf(value),
      Object.getOwnPropertyDescriptors(value)
    );

    visited.set(value, result);

    for (const key of Reflect.ownKeys(value)) {
      const originalValue = Reflect.get(value, key);

      if (!isObject(originalValue)) {
        Reflect.set(result, key, originalValue);
        continue;
      }

      const clone = createSnapshot(originalValue, visited);
      Reflect.set(result, key, clone);
    }

    return result as T;
  }

  return value;
}
