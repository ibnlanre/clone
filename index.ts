type Dictionary = Record<PropertyKey, unknown>;
type GenericObject = Record<string, any>;

/**
 * Check if the value is a dictionary.
 *
 * @param value The value to check.
 *
 * @returns A boolean indicating whether the value is a dictionary.
 */
function isDictionary(value: unknown): value is Dictionary {
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
 * snapshot a function while preserving its properties.
 * The snapshotd function will have the same properties as the original.
 *
 * @param fn - The function to snapshot
 * @returns A new function that is a snapshot of the original
 */
const cloneFunction = (fn: Function) => {
  return Object.assign(fn.bind(null), fn);
};

function createSnapshot<T>(value: T, visited = new WeakMap()): T {
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
      snapshot.set(createSnapshot(key, visited), createSnapshot(val, visited));
    });

    return snapshot as T;
  }

  if (value instanceof Set) {
    const snapshot = new Set();
    visited.set(value, snapshot);

    value.forEach((val) => {
      snapshot.add(createSnapshot(val, visited));
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
          value: createSnapshot(descriptor.value, visited),
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
      snapshot[index] = createSnapshot(item, visited);
    });

    return snapshot as T;
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

      const snapshot = createSnapshot(originalValue, visited);
      Reflect.set(result, key, snapshot);
    }

    return result as T;
  }

  return value as never;
}

/**
 * Creates a deep clone of a value.
 *
 * @param value The value to clone.
 * @returns The cloned value.
 */
export default function clone<T>(value: T): T {
  return createSnapshot(value);
}
