/**
 * Check if the value is a plain object.
 *
 * @param value The value to check.
 * @returns A boolean indicating whether the value is a plain object.
 */
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

/**
 * clone a function while preserving its properties.
 * The cloned function will have the same properties as the original.
 *
 * @param fn - The function to clone
 * @returns A new function that is a clone of the original
 */
const cloneFunction = (fn: Function) => {
  const copy = function (this: any, ...args: any[]) {
    if (new.target) {
      const instance = Object.create(copy.prototype);
      const result = fn.apply(instance, args);
      return isObject(result) ? result : instance;
    }

    return fn.apply(this, args);
  };

  Object.assign(copy, fn);

  if (fn.prototype) {
    copy.prototype = Object.create(null);
    Object.assign(copy.prototype, fn.prototype);
    Reflect.defineProperty(copy.prototype, "constructor", {
      value: copy,
      writable: true,
      configurable: true,
    });
  }

  return copy;
};

/**
 * Creates a deep clone of a value.
 *
 * @param value The value to clone.
 * @param visited A WeakMap to track visited objects to prevent circular references.
 *
 * @returns The cloned value.
 */
export default function clone<T>(value: T, visited = new WeakMap()): T {
  if (typeof value === "function") {
    const snapshot = cloneFunction(value);
    visited.set(value, snapshot);
    return snapshot as T;
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
    const snapshot = new Map();
    visited.set(value, snapshot);

    value.forEach((val, key) => {
      snapshot.set(clone(key, visited), clone(val, visited));
    });

    return snapshot as T;
  }

  if (value instanceof Set) {
    const snapshot = new Set();
    visited.set(value, snapshot);

    value.forEach((val) => {
      snapshot.add(clone(val, visited));
    });

    return snapshot as T;
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
    const snapshot = new Constructor(value.message);

    snapshot.name = value.name;
    snapshot.stack = value.stack;
    visited.set(value, snapshot);

    for (const key of Object.getOwnPropertyNames(value)) {
      if (["message", "name", "stack"].includes(key)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor) {
        Object.defineProperty(snapshot, key, {
          ...descriptor,
          value: clone(descriptor.value, visited),
        });
      }
    }

    return snapshot as T;
  }

  if (value instanceof URL) {
    return new URL(value.href) as T;
  }

  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value.toString()) as T;
  }

  if (Array.isArray(value)) {
    const snapshot = [] as typeof value;

    visited.set(value, snapshot);

    value.forEach((item, index) => {
      snapshot[index] = clone(item, visited);
    });

    return snapshot as T;
  }

  const snapshot = Object.create(Object.getPrototypeOf(value));
  visited.set(value, snapshot);

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;

    if ("get" in descriptor || "set" in descriptor) {
      // Accessor descriptor
      Object.defineProperty(snapshot, key, descriptor);
    } else {
      // Data descriptor
      Object.defineProperty(snapshot, key, {
        ...descriptor,
        value: clone((value as any)[key], visited),
      });
    }
  }

  return snapshot as T;
}
