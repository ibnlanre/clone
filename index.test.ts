import { describe, expect, it } from "vitest";

import clone from "./index";

describe("clone", () => {
  it("should create a snapshot of the given state", () => {
    const state = { a: 1, b: 2, c: 3 };
    const snapshot = clone(state);

    expect(snapshot).toEqual(state);
    expect(snapshot).not.toBe(state);
  });

  it("should preserve the prototype of the original state", () => {
    class State {
      a = 1;
      b = 2;
    }

    const state = new State();
    const snapshot = clone(<any>state);

    expect(Object.getPrototypeOf(snapshot)).toBe(State.prototype);
  });

  it("should include non-enumerable properties in the snapshot", () => {
    const state = {};
    Object.defineProperty(state, "a", {
      enumerable: false,
      value: 1,
    });

    const snapshot = clone(state);

    expect(snapshot).toHaveProperty("a", 1);
    expect(Object.getOwnPropertyDescriptor(snapshot, "a")?.enumerable).toBe(
      false
    );
  });

  it("should deep clone nested objects, not maintain references", () => {
    const nested = { x: 10, y: 20 };
    const state = { a: 1, nested };

    const snapshot = clone(state);

    expect(snapshot.nested).toEqual(nested);
    expect(snapshot.nested).not.toBe(nested);

    nested.x = 99;
    expect(snapshot.nested.x).toBe(10);
  });

  it("should handle simple circular references", () => {
    const obj: { name: string; self?: typeof obj } = { name: "circular" };
    obj.self = obj;

    const snapshot = clone(obj);

    expect(snapshot).not.toBe(obj);
    expect(snapshot.name).toBe("circular");
    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.self?.name).toBe("circular");
  });

  it("should handle mutual circular references", () => {
    const objA: { name: string; ref?: typeof objB } = { name: "A" };
    const objB: { name: string; ref?: typeof objA } = { name: "B" };
    objA.ref = objB;
    objB.ref = objA;

    const container = { a: objA, b: objB };
    const snapshot = clone(container);

    expect(snapshot).not.toBe(container);
    expect(snapshot.a).not.toBe(objA);
    expect(snapshot.b).not.toBe(objB);

    expect(snapshot.a.ref).toBe(snapshot.b);
    expect(snapshot.b.ref).toBe(snapshot.a);

    expect(snapshot.a.name).toBe("A");
    expect(snapshot.b.name).toBe("B");
  });

  it("should handle circular references in arrays", () => {
    type ArrayWithCircularRef = (ArrayWithCircularRef | number)[];
    const arr: ArrayWithCircularRef = [1, 2];
    arr.push(arr);

    const snapshot = clone(arr);

    expect(snapshot).not.toBe(arr);
    expect(snapshot[0]).toBe(1);
    expect(snapshot[1]).toBe(2);
    expect(snapshot[2]).toBe(snapshot);
    expect((snapshot[2] as ArrayWithCircularRef)[0]).toBe(1);
  });

  it("should handle deep circular references", () => {
    const root: {
      level1: {
        level2: {
          level3: {
            backToRoot?: typeof root;
            value: string;
          };
        };
      };
    } = {
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    };
    root.level1.level2.level3.backToRoot = root;

    const snapshot = clone(root);

    expect(snapshot).not.toBe(root);
    expect(snapshot.level1.level2.level3.value).toBe("deep");
    expect(snapshot.level1.level2.level3.backToRoot).toBe(snapshot);
    expect(
      snapshot.level1.level2.level3.backToRoot?.level1.level2.level3.value
    ).toBe("deep");
  });

  it("should handle multiple references to the same object", () => {
    const shared = { value: "shared" };
    const container = {
      nested: {
        ref3: shared,
      },
      ref1: shared,
      ref2: shared,
    };

    const snapshot = clone(container);

    expect(snapshot).not.toBe(container);
    expect(snapshot.ref1).not.toBe(shared);

    expect(snapshot.ref1).toBe(snapshot.ref2);
    expect(snapshot.ref1).toBe(snapshot.nested.ref3);
    expect(snapshot.ref1.value).toBe("shared");
  });

  it("should handle circular references with Date objects", () => {
    const date = new Date("2023-01-01");
    const obj: {
      self?: typeof obj;
      timestamp: Date;
      value: string;
    } = {
      timestamp: date,
      value: "test",
    };
    obj.self = obj;

    const snapshot = clone(obj);

    expect(snapshot.timestamp).not.toBe(date);
    expect(snapshot.timestamp).toEqual(date);
    expect(snapshot.timestamp instanceof Date).toBe(true);
    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.self?.value).toBe("test");
  });

  it("should handle circular references with RegExp objects", () => {
    const regex = /test/gi;
    const obj: {
      pattern: RegExp;
      self?: typeof obj;
      value: string;
    } = {
      pattern: regex,
      value: "test",
    };
    obj.self = obj;

    const snapshot = clone(obj);

    expect(snapshot.pattern).not.toBe(regex);
    expect(snapshot.pattern).toEqual(regex);
    expect(snapshot.pattern instanceof RegExp).toBe(true);
    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.self?.value).toBe("test");
  });

  it("should handle circular references with mixed data types", () => {
    type Complex = {
      array: (Complex | number)[];
      boolean: boolean;
      date: Date;
      nested: {
        backToRoot?: typeof complex;
        deep: {
          value: string;
        };
      };
      null: null;
      number: number;
      regex: RegExp;
      self?: typeof complex;
      string: string;
      undefined: undefined;
    };

    const complex: Complex = {
      array: [1, 2, 3],
      boolean: true,
      date: new Date("2023-01-01"),
      nested: {
        deep: {
          value: "nested",
        },
      },
      null: null,
      number: 42,
      regex: /pattern/g,
      string: "hello",
      undefined: undefined,
    };

    complex.self = complex;
    complex.array.push(complex);
    complex.nested.backToRoot = complex;

    const snapshot = clone(complex);

    expect(snapshot).not.toBe(complex);
    expect(snapshot.string).toBe("hello");
    expect(snapshot.number).toBe(42);
    expect(snapshot.boolean).toBe(true);
    expect(snapshot.null).toBe(null);
    expect(snapshot.undefined).toBe(undefined);

    expect(snapshot.date).not.toBe(complex.date);
    expect(snapshot.date).toEqual(complex.date);

    expect(snapshot.regex).not.toBe(complex.regex);
    expect(snapshot.regex).toEqual(complex.regex);

    expect(snapshot.array).not.toBe(complex.array);
    expect(snapshot.array.slice(0, 3)).toEqual([1, 2, 3]);

    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.array[3]).toBe(snapshot);
    expect(snapshot.nested.backToRoot).toBe(snapshot);
    expect(snapshot.nested.deep.value).toBe("nested");
  });

  it("should not create infinite loops when accessing circular properties", () => {
    const obj: { circular?: typeof obj; value: number } = { value: 1 };
    obj.circular = obj;

    const snapshot = clone(obj);

    expect(() => {
      const keys = Object.keys(snapshot);
      return keys.includes("value") && keys.includes("circular");
    }).not.toThrow();

    expect(() => {
      return JSON.stringify(snapshot, (key, value) => {
        return typeof value === "object" && value !== null && key !== ""
          ? "[Circular]"
          : value;
      });
    }).not.toThrow();
  });

  it("should deep clone without mutating original", () => {
    const original = {
      user: {
        preferences: {
          notifications: true,
          theme: "light",
        },
      },
    };

    const snapshot = clone(original);
    snapshot.user.preferences.theme = "MUTATED";

    expect(original.user.preferences.theme).toBe("light");
  });

  it("should handle non-dictionary objects by returning them as-is", () => {
    const customFunction = function customFn() {
      return "test";
    };
    customFunction.customProp = "value";

    const snapshot = clone(customFunction);

    expect(snapshot).not.toBe(customFunction);
    expect(snapshot.customProp).toBe("value");
  });

  it("should deep clone Map objects", () => {
    const map = new Map<any, any>([
      ["key1", "value1"],
      ["key2", { nested: "object" }],
      [{ objKey: true }, "objectKeyValue"],
    ]);

    const snapshot = clone(map);

    expect(snapshot).not.toBe(map);
    expect(snapshot instanceof Map).toBe(true);
    expect(snapshot.size).toBe(3);
    expect(snapshot.get("key1")).toBe("value1");

    expect(snapshot.get("key2")).toEqual({ nested: "object" });
    expect(snapshot.get("key2")).not.toBe(map.get("key2"));

    const originalObjKey = Array.from(map.keys()).find(
      (k) => typeof k === "object"
    );
    const snapshotObjKey = Array.from(snapshot.keys()).find(
      (k) => typeof k === "object"
    );
    expect(snapshotObjKey).toEqual(originalObjKey);
    expect(snapshotObjKey).not.toBe(originalObjKey);
  });

  it("should deep clone Set objects", () => {
    const set = new Set([[1, 2, 3], "primitive", { nested: "object" }]);

    const snapshot = clone(set);

    expect(snapshot).not.toBe(set);
    expect(snapshot instanceof Set).toBe(true);
    expect(snapshot.size).toBe(3);
    expect(snapshot.has("primitive")).toBe(true);

    const originalObj = Array.from(set).find(
      (item) => typeof item === "object" && !Array.isArray(item)
    );
    const snapshotObj = Array.from(snapshot).find(
      (item) => typeof item === "object" && !Array.isArray(item)
    );
    expect(snapshotObj).toEqual(originalObj);
    expect(snapshotObj).not.toBe(originalObj);

    const originalArray = Array.from(set).find((item) => Array.isArray(item));
    const snapshotArray = Array.from(snapshot).find((item) =>
      Array.isArray(item)
    );

    expect(snapshotArray).toEqual(originalArray);
    expect(snapshotArray).not.toBe(originalArray);
  });

  it("should clone ArrayBuffer objects", () => {
    const buffer = new ArrayBuffer(16);
    const view = new Uint8Array(buffer);
    view[0] = 42;
    view[15] = 255;

    const snapshot = clone(buffer);

    expect(snapshot).not.toBe(buffer);
    expect(snapshot instanceof ArrayBuffer).toBe(true);
    expect(snapshot.byteLength).toBe(16);

    const snapshotView = new Uint8Array(snapshot);
    expect(snapshotView[0]).toBe(42);
    expect(snapshotView[15]).toBe(255);

    view[0] = 100;
    expect(snapshotView[0]).toBe(42);
  });

  it("should handle circular references in Map objects", () => {
    const map = new Map();
    const obj = { map, name: "test" };
    map.set("self", map);
    map.set("obj", obj);

    const snapshot = clone(map);

    expect(snapshot).not.toBe(map);
    expect(snapshot.get("self")).toBe(snapshot);
    expect(snapshot.get("obj")).not.toBe(obj);
    expect(snapshot.get("obj").map).toBe(snapshot);
    expect(snapshot.get("obj").name).toBe("test");
  });

  it("should handle circular references in Set objects", () => {
    type Element = { name: string; set?: Set<Element> };
    const set = new Set<Element>();
    const obj = { name: "test", set };

    set.add(obj as Element);
    const snapshot = clone(set);
    expect(snapshot).not.toBe(set);

    const snapshotObj = Array.from(snapshot).find(
      (item) => item.name === "test"
    ) as Element;

    expect(snapshotObj).not.toBe(obj);
    expect(snapshotObj.set).toBe(snapshot);
    expect(snapshotObj.name).toBe("test");
  });

  const innerMap = new Map([["inner", "value"]]);
  const innerSet = new Set(["setItem"]);

  it("should handle nested Map", () => {
    const outerMap = new Map([["map", innerMap]]);
    const snapshot = clone(outerMap);

    expect(snapshot).not.toBe(outerMap);
    expect(snapshot.get("map")).not.toBe(innerMap);
    expect(snapshot.get("map")?.get("inner")).toBe("value");
  });

  it("should handle nested Set", () => {
    const outerSet = new Map([["set", innerSet]]);
    const snapshot = clone(outerSet);

    expect(snapshot.get("set")).not.toBe(innerSet);
    expect(snapshot.get("set")?.has("setItem")).toBe(true);
  });

  it("should handle nested Map and Set in an array", () => {
    type Data = [number, Map<string, string>, Set<string>];
    type Element<Arr extends readonly unknown[], T extends number> = Arr[T];

    const array = [1, innerMap, innerSet] as Data;
    const outerMapWithArray = new Map([["array", array]]);

    const snapshot = clone(outerMapWithArray);
    const snapshotValue = snapshot.get("array") as Data;
    expect(snapshot).not.toBe(outerMapWithArray);

    const numberFromArray = snapshotValue.at(0) as Element<Data, 0>;
    expect(numberFromArray).toBe(1);
    expect(snapshot.get("array")).not.toBe(array);

    const innerMapFromArray = snapshotValue.at(1) as Element<Data, 1>;
    expect(innerMapFromArray).not.toBe(innerMap);
    expect(innerMapFromArray.get("inner")).toBe("value");

    const innerSetFromArray = snapshotValue.at(2) as Element<Data, 2>;
    expect(innerSetFromArray).not.toBe(innerSet);
    expect(innerSetFromArray.has("setItem")).toBe(true);
  });

  it("should handle Map with circular key references", () => {
    const obj1: { name: string; ref?: typeof obj2 } = { name: "obj1" };
    const obj2 = { name: "obj2", ref: obj1 };
    obj1.ref = obj2;

    const map = new Map();
    map.set(obj1, "value1");
    map.set(obj2, "value2");

    const snapshot = clone(map);

    expect(snapshot).not.toBe(map);
    expect(snapshot.size).toBe(2);

    const keys = Array.from(snapshot.keys());
    const snapshotObj1 = keys.find((k) => k.name === "obj1");
    const snapshotObj2 = keys.find((k) => k.name === "obj2");

    expect(snapshotObj1).not.toBe(obj1);
    expect(snapshotObj2).not.toBe(obj2);
    expect(snapshotObj1.ref).toBe(snapshotObj2);
    expect(snapshotObj2.ref).toBe(snapshotObj1);

    expect(snapshot.get(snapshotObj1)).toBe("value1");
    expect(snapshot.get(snapshotObj2)).toBe("value2");
  });

  it("should handle mixed built-in types with circular references", () => {
    const container = {
      buffer: new ArrayBuffer(8),
      date: new Date("2023-01-01"),
      map: new Map(),
      regex: /test/g,
      set: new Set(),
    };

    container.map.set("container", container);
    container.set.add(container);

    const snapshot = clone(container);

    expect(snapshot).not.toBe(container);
    expect(snapshot.map.get("container")).toBe(snapshot);
    expect(snapshot.set.has(snapshot)).toBe(true);
    expect(snapshot.buffer).not.toBe(container.buffer);
    expect(snapshot.buffer.byteLength).toBe(8);
    expect(snapshot.date).not.toBe(container.date);
    expect(snapshot.date).toEqual(container.date);
    expect(snapshot.regex).not.toBe(container.regex);
    expect(snapshot.regex).toEqual(container.regex);
  });

  it("should clone typed arrays", () => {
    const int8Array = new Int8Array([1, -2, 3, -4]);
    const uint8Array = new Uint8Array([255, 128, 64, 32]);
    const int16Array = new Int16Array([1000, -2000, 3000]);
    const uint16Array = new Uint16Array([65535, 32768, 16384]);
    const int32Array = new Int32Array([100000, -200000]);
    const uint32Array = new Uint32Array([4294967295, 2147483648]);
    const float32Array = new Float32Array([3.14, -2.71, 1.41]);
    const float64Array = new Float64Array([Math.PI, Math.E, Math.SQRT2]);

    const arrays = {
      float32Array,
      float64Array,
      int8Array,
      int16Array,
      int32Array,
      uint8Array,
      uint16Array,
      uint32Array,
    };

    const snapshot = clone(arrays);

    expect(snapshot.int8Array).not.toBe(int8Array);
    expect(snapshot.int8Array).toEqual(int8Array);
    expect(snapshot.int8Array instanceof Int8Array).toBe(true);

    expect(snapshot.uint8Array).not.toBe(uint8Array);
    expect(snapshot.uint8Array).toEqual(uint8Array);
    expect(snapshot.uint8Array instanceof Uint8Array).toBe(true);

    expect(snapshot.int16Array).not.toBe(int16Array);
    expect(snapshot.int16Array).toEqual(int16Array);
    expect(snapshot.int16Array instanceof Int16Array).toBe(true);

    expect(snapshot.uint16Array).not.toBe(uint16Array);
    expect(snapshot.uint16Array).toEqual(uint16Array);
    expect(snapshot.uint16Array instanceof Uint16Array).toBe(true);

    expect(snapshot.int32Array).not.toBe(int32Array);
    expect(snapshot.int32Array).toEqual(int32Array);
    expect(snapshot.int32Array instanceof Int32Array).toBe(true);

    expect(snapshot.uint32Array).not.toBe(uint32Array);
    expect(snapshot.uint32Array).toEqual(uint32Array);
    expect(snapshot.uint32Array instanceof Uint32Array).toBe(true);

    expect(snapshot.float32Array).not.toBe(float32Array);
    expect(snapshot.float32Array).toEqual(float32Array);
    expect(snapshot.float32Array instanceof Float32Array).toBe(true);

    expect(snapshot.float64Array).not.toBe(float64Array);
    expect(snapshot.float64Array).toEqual(float64Array);
    expect(snapshot.float64Array instanceof Float64Array).toBe(true);

    int8Array[0] = 99;
    expect(snapshot.int8Array[0]).toBe(1);
  });

  it("should clone DataView objects", () => {
    const buffer = new ArrayBuffer(16);
    const dataView = new DataView(buffer, 4, 8);

    dataView.setInt32(0, 0x12345678);
    dataView.setFloat32(4, 3.14159);

    const snapshot = clone(dataView);

    expect(snapshot).not.toBe(dataView);
    expect(snapshot instanceof DataView).toBe(true);
    expect(snapshot.buffer).not.toBe(buffer);
    expect(snapshot.byteOffset).toBe(4);
    expect(snapshot.byteLength).toBe(8);
    expect(snapshot.getInt32(0)).toBe(0x12345678);
    expect(snapshot.getFloat32(4)).toBeCloseTo(3.14159, 5);

    dataView.setInt32(0, 0x87654321);
    expect(snapshot.getInt32(0)).toBe(0x12345678);
  });

  it("should clone Error objects", () => {
    const error: any = new Error("Test error message");

    error.stack = "Error stack trace";
    error.customProperty = "value";
    error.nestedObject = { deep: "value" };

    const snapshot: any = clone(error);

    expect(snapshot).not.toBe(error);
    expect(snapshot instanceof Error).toBe(true);
    expect(snapshot.message).toBe("Test error message");
    expect(snapshot.name).toBe("Error");
    expect(snapshot.stack).toBe(error.stack);
    expect(snapshot.customProperty).toBe("value");
    expect(snapshot.nestedObject).toEqual({ deep: "value" });
    expect(snapshot.nestedObject).not.toBe(error.nestedObject);
  });

  it("should clone different Error types", () => {
    const typeError = new TypeError("Type error message");
    const rangeError = new RangeError("Range error message");
    const referenceError = new ReferenceError("Reference error message");

    const errors = { rangeError, referenceError, typeError };
    const snapshot = clone(errors);

    expect(snapshot.typeError).not.toBe(typeError);
    expect(snapshot.typeError instanceof TypeError).toBe(true);
    expect(snapshot.typeError.message).toBe("Type error message");

    expect(snapshot.rangeError).not.toBe(rangeError);
    expect(snapshot.rangeError instanceof RangeError).toBe(true);
    expect(snapshot.rangeError.message).toBe("Range error message");

    expect(snapshot.referenceError).not.toBe(referenceError);
    expect(snapshot.referenceError instanceof ReferenceError).toBe(true);
    expect(snapshot.referenceError.message).toBe("Reference error message");
  });

  it("should clone URL objects", () => {
    const url = new URL("https://example.com:8080/path?query=value#fragment");
    const container = { metadata: { title: "Example" }, url };

    const snapshot = clone(container);

    expect(snapshot.url).not.toBe(url);
    expect(snapshot.url instanceof URL).toBe(true);
    expect(snapshot.url.href).toBe(
      "https://example.com:8080/path?query=value#fragment"
    );
    expect(snapshot.url.hostname).toBe("example.com");
    expect(snapshot.url.port).toBe("8080");
    expect(snapshot.url.pathname).toBe("/path");
    expect(snapshot.url.search).toBe("?query=value");
    expect(snapshot.url.hash).toBe("#fragment");
    expect(snapshot.metadata).not.toBe(container.metadata);
  });

  it("should clone URLSearchParams objects", () => {
    const params = new URLSearchParams("name=John&age=30&city=New%20York");
    const container = { options: { sorted: true }, params };

    const snapshot = clone(container);

    expect(snapshot.params).not.toBe(params);
    expect(snapshot.params instanceof URLSearchParams).toBe(true);
    expect(snapshot.params.get("name")).toBe("John");
    expect(snapshot.params.get("age")).toBe("30");
    expect(snapshot.params.get("city")).toBe("New York");
    expect(snapshot.params.toString()).toBe(params.toString());
    expect(snapshot.options).not.toBe(container.options);

    params.set("name", "Jane");
    expect(snapshot.params.get("name")).toBe("John");
  });

  it("should handle circular references with typed arrays", () => {
    const container: {
      data: Uint8Array;
      self?: typeof container;
    } = {
      data: new Uint8Array([1, 2, 3, 4]),
    };
    container.self = container;

    const snapshot = clone(container);

    expect(snapshot).not.toBe(container);
    expect(snapshot.data).not.toBe(container.data);
    expect(snapshot.data).toEqual(container.data);
    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.self?.data).toBe(snapshot.data);
  });

  it("should handle circular references with Error objects", () => {
    const error: any = new Error("Circular error");
    const container: { error: Error; self?: typeof container } = { error };

    container.self = container;
    error.container = container;

    const snapshot: any = clone(container);

    expect(snapshot).not.toBe(container);
    expect(snapshot.error).not.toBe(error);
    expect(snapshot.error.message).toBe("Circular error");
    expect(snapshot.self).toBe(snapshot);
    expect(snapshot.error.container).toBe(snapshot);
  });

  it("should handle complex nested structures with new object types", () => {
    const complex = {
      arrays: {
        float64: new Float64Array([1.1, 2.2, 3.3]),
        int32: new Int32Array([100, 200, 300]),
      },
      buffer: new ArrayBuffer(32),
      errors: {
        generic: new Error("Generic error"),
        type: new TypeError("Type error"),
      },
      params: new URLSearchParams("filter=active&sort=name"),
      urls: {
        api: new URL("https://api.example.com/v1/users"),
        docs: new URL("https://docs.example.com"),
      },
      view: null as DataView | null,
    };

    const dataView = new DataView(complex.buffer, 8, 16);
    dataView.setFloat32(0, 42.5);
    complex.view = dataView;

    const snapshot = clone(complex);

    expect(snapshot.arrays.int32).not.toBe(complex.arrays.int32);
    expect(snapshot.arrays.int32).toEqual(complex.arrays.int32);
    expect(snapshot.arrays.float64).not.toBe(complex.arrays.float64);
    expect(snapshot.arrays.float64).toEqual(complex.arrays.float64);

    expect(snapshot.buffer).not.toBe(complex.buffer);
    expect(snapshot.buffer.byteLength).toBe(32);

    expect(snapshot.view).not.toBe(dataView);
    expect(snapshot.view?.getFloat32(0)).toBe(42.5);

    expect(snapshot.errors.generic).not.toBe(complex.errors.generic);
    expect(snapshot.errors.generic.message).toBe("Generic error");
    expect(snapshot.errors.type).not.toBe(complex.errors.type);
    expect(snapshot.errors.type instanceof TypeError).toBe(true);

    expect(snapshot.urls.api).not.toBe(complex.urls.api);
    expect(snapshot.urls.api.href).toBe("https://api.example.com/v1/users");
    expect(snapshot.urls.docs).not.toBe(complex.urls.docs);
    expect(snapshot.urls.docs.hostname).toBe("docs.example.com");

    expect(snapshot.params).not.toBe(complex.params);
    expect(snapshot.params.get("filter")).toBe("active");
    expect(snapshot.params.get("sort")).toBe("name");
  });

  it("should properly handle Symbol properties", () => {
    const symbolKey = Symbol("test");
    const obj = {
      [symbolKey]: "symbol value",
      regularKey: "regular value",
    };

    const snapshot = clone(obj);

    expect(snapshot[symbolKey]).toBe("symbol value");
    expect(snapshot.regularKey).toBe("regular value");
    expect(Object.getOwnPropertySymbols(snapshot)).toEqual([symbolKey]);
  });

  it("should clone BigInt values", () => {
    const obj = {
      small: BigInt(123),
      large: BigInt("9007199254740991"),
    };

    const snapshot = clone(obj);

    expect(snapshot.small).toBe(BigInt(123));
    expect(snapshot.large).toBe(BigInt("9007199254740991"));
  });

  it("should handle BigInt64Array and BigUint64Array", () => {
    if (typeof BigInt64Array !== "undefined") {
      const bigInt64Array = new BigInt64Array([
        BigInt(1),
        BigInt(2),
        BigInt(3),
      ]);
      const bigUint64Array = new BigUint64Array([
        BigInt(1),
        BigInt(2),
        BigInt(3),
      ]);

      const snapshot1 = clone(bigInt64Array);
      const snapshot2 = clone(bigUint64Array);

      expect(snapshot1).not.toBe(bigInt64Array);
      expect(snapshot1 instanceof BigInt64Array).toBe(true);
      expect([...snapshot1]).toEqual([BigInt(1), BigInt(2), BigInt(3)]);

      expect(snapshot2).not.toBe(bigUint64Array);
      expect(snapshot2 instanceof BigUint64Array).toBe(true);
      expect([...snapshot2]).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
    }
  });

  it("should maintain function properties and prototype methods", () => {
    function originalFn(x: number) {
      return x * 2;
    }
    originalFn.staticProp = "static value";
    originalFn.prototype.method = function () {
      return "method result";
    };

    const snapshotFn = clone(originalFn);

    expect(typeof snapshotFn).toBe("function");
    expect(snapshotFn).not.toBe(originalFn);
    expect(snapshotFn.staticProp).toBe("static value");

    const originalInstance = Object.create(originalFn.prototype);
    const snapshotInstance = Object.create(snapshotFn.prototype);

    expect((originalInstance as any).method()).toBe("method result");
    expect((snapshotInstance as any).method()).toBe("method result");
  });

  it("should correctly clone constructor functions", () => {
    function PersonConstructor(this: any, name: string, age: number) {
      this.name = name;
      this.age = age;
    }

    (PersonConstructor as any).species = "Human";
    (PersonConstructor as any).getInfo = function () {
      return "This is a Person constructor";
    };

    PersonConstructor.prototype.greet = function (this: any) {
      return `Hello, I'm ${this.name} and I'm ${this.age} years old`;
    };

    PersonConstructor.prototype.getAge = function (this: any) {
      return this.age;
    };

    const clonedConstructor = clone(PersonConstructor);

    expect(clonedConstructor).not.toBe(PersonConstructor);
    expect(typeof clonedConstructor).toBe("function");

    expect((clonedConstructor as any).species).toBe("Human");
    expect((clonedConstructor as any).getInfo()).toBe(
      "This is a Person constructor"
    );

    const originalPerson = new (PersonConstructor as any)("John", 30);
    const clonedPerson = new (clonedConstructor as any)("Jane", 25);

    expect(originalPerson.name).toBe("John");
    expect(originalPerson.age).toBe(30);
    expect(clonedPerson.name).toBe("Jane");
    expect(clonedPerson.age).toBe(25);

    expect(originalPerson.greet()).toBe("Hello, I'm John and I'm 30 years old");
    expect(clonedPerson.greet()).toBe("Hello, I'm Jane and I'm 25 years old");
    expect(originalPerson.getAge()).toBe(30);
    expect(clonedPerson.getAge()).toBe(25);

    expect(clonedConstructor.prototype).not.toBe(PersonConstructor.prototype);
    expect(clonedPerson.constructor).toBe(clonedConstructor);
    expect(originalPerson.constructor).toBe(PersonConstructor);

    expect(originalPerson instanceof PersonConstructor).toBe(true);
    expect(clonedPerson instanceof clonedConstructor).toBe(true);
    expect(clonedPerson instanceof PersonConstructor).toBe(false);
    expect(originalPerson instanceof clonedConstructor).toBe(false);
  });

  it("should handle edge cases with empty or sparse arrays", () => {
    const emptyArray: any[] = [];
    const sparseArray = [1, , 3, , 5];
    const explicitlyUndefinedArray = [1, undefined, 3, undefined, 5];

    const snapshot1 = clone(emptyArray);
    const snapshot2 = clone(sparseArray);
    const snapshot3 = clone(explicitlyUndefinedArray);

    expect(snapshot1).toEqual([]);
    expect(snapshot1).not.toBe(emptyArray);

    expect(snapshot2.length).toBe(5);
    expect(0 in snapshot2).toBe(true);
    expect(1 in snapshot2).toBe(false);
    expect(2 in snapshot2).toBe(true);

    expect(snapshot3.length).toBe(5);
    expect(snapshot3[1]).toBe(undefined);
    expect(1 in snapshot3).toBe(true);
  });

  it("should handle object with getters and setters", () => {
    let internalValue = 10;
    const original = {
      get value() {
        return internalValue;
      },
      set value(v: number) {
        internalValue = v;
      },
    };

    const snapshot = clone(original);

    expect(
      Object.getOwnPropertyDescriptor(snapshot, "value")?.get
    ).toBeDefined();
    expect(
      Object.getOwnPropertyDescriptor(snapshot, "value")?.set
    ).toBeDefined();

    expect(snapshot.value).toBe(10);

    internalValue = 20;
    expect(original.value).toBe(20);
    expect(snapshot.value).toBe(20);
  });

  it("should handle Proxy objects", () => {
    const target = { message: "Hello", value: 42 };
    const handler = {
      get(obj: any, prop: string) {
        return obj[prop] + " World";
      },
    };
    const proxy = new Proxy(target, handler);

    const snapshot = clone(proxy);

    expect(snapshot).toEqual({ message: "Hello World", value: "42 World" });
    expect(snapshot).not.toBe(proxy);
  });

  it("should handle objects with non-configurable or non-writable properties", () => {
    const obj: Record<string, any> = {};
    Object.defineProperty(obj, "readOnly", {
      configurable: true,
      enumerable: true,
      value: "fixed value",
      writable: false,
    });

    Object.defineProperty(obj, "sealed", {
      configurable: false,
      enumerable: true,
      value: "sealed value",
      writable: true,
    });

    const snapshot = clone(obj)

    const readOnlyDesc = Object.getOwnPropertyDescriptor(snapshot, "readOnly");
    const sealedDesc = Object.getOwnPropertyDescriptor(snapshot, "sealed");

    expect(readOnlyDesc?.writable).toBe(false);
    expect(sealedDesc?.configurable).toBe(false);
    expect(snapshot.readOnly).toBe("fixed value");
    expect(snapshot.sealed).toBe("sealed value");
  });

  it("should handle objects with undefined values explicitly", () => {
    const obj = { a: undefined, b: null, c: 0, d: "" };
    const snapshot = clone(obj);

    expect("a" in snapshot).toBe(true);
    expect(snapshot.a).toBe(undefined);
    expect("b" in snapshot).toBe(true);
    expect(snapshot.b).toBe(null);
    expect(snapshot.c).toBe(0);
    expect(snapshot.d).toBe("");
  });
});
