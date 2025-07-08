import clone from "./index";

import { describe, expect, it } from "vitest";

function benchmark(name: string, fn: () => void, iterations: number = 1000) {
  // Warm up to ensure JIT optimization
  for (let i = 0; i < Math.min(10, iterations / 10); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSecond = 1000 / avgTime;

  console.log(`\n🔥 ${name}`);
  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Average per operation: ${avgTime.toFixed(4)}ms`);
  console.log(`Operations per second: ${opsPerSecond.toFixed(0)}`);

  return { avgTime, opsPerSecond, totalTime };
}

function createComplexObject(depth: number = 5, breadth: number = 5): any {
  if (depth === 0) return Math.random();

  const obj: any = {};
  for (let i = 0; i < breadth; i++) {
    obj[`prop${i}`] = createComplexObject(depth - 1, breadth);
  }
  return obj;
}

function createLargeArray(size: number): any[] {
  return Array.from({ length: size }, (_, i) => ({
    data: Math.random(),
    id: i,
    name: `item${i}`,
    nested: { value: i * 2 },
  }));
}

function measureTime(fn: () => void, iterations: number = 1000): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return end - start;
}

const createTestData = {
  circular: () => {
    const obj: any = { a: 1, b: { c: 2 } };
    obj.self = obj;
    obj.b.parent = obj;
    return obj;
  },

  complex: () => ({
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      timestamp: new Date(),
      value: Math.random(),
    })),
    metadata: new Map<string, any>([
      ["created", new Date()],
      ["tags", new Set(["clone", "performance", "test"])],
      ["version", "1.0"],
    ]),
    user: {
      email: "john@example.com",
      id: 123,
      name: "John Doe",
      profile: {
        avatar: "avatar.jpg",
        settings: {
          notifications: true,
          privacy: {
            level: "medium",
            tracking: false,
          },
          theme: "dark",
        },
      },
    },
  }),

  comprehensive: () => ({
    a: 1,
    b: [1, 2, 3],
    c: { d: "test", e: new Date() },
    f: new Map([["key", "value"]]),
    g: new Set([1, 2, 3]),
    h: new URL("https://example.com"),
    i: new URLSearchParams("a=1&b=2"),
    j: new Error("Test error"),
    k: new Uint8Array([1, 2, 3]),
    l: new DataView(new ArrayBuffer(8)),
    n: function testFunc() {
      return "Hello";
    },
    p: new Int32Array([1, 2, 3]),
    q: new BigInt64Array([BigInt(1), BigInt(2), BigInt(3)]),
    r: new Float64Array([1.1, 2.2, 3.3]),
  }),

  function: () => {
    function testFunction(x: number, y: number) {
      return x + y;
    }
    testFunction.metadata = { author: "test", version: "1.0" };
    return testFunction;
  },

  map: (size: number = 500) => {
    const map = new Map();
    for (let i = 0; i < size; i++) {
      map.set(`key${i}`, { data: Math.random(), id: i });
    }
    return map;
  },

  set: (size: number = 500) => {
    const set = new Set();
    for (let i = 0; i < size; i++) {
      set.add({ id: i, value: `value${i}` });
    }
    return set;
  },

  simple: () => ({ a: 1, b: "hello", c: true, d: null, e: [1, 2, 3] }),
};

describe("Performance Tests", () => {
  const performanceResults: Record<
    string,
    { avgTime: number; opsPerSecond: number; totalTime: number }
  > = {};

  it("should clone simple objects efficiently", () => {
    const simpleObj = createTestData.simple();
    const iterations = 50000;

    const result = benchmark(
      "Simple Object Clone",
      () => clone(simpleObj),
      iterations
    );
    performanceResults.simple = result;

    expect(result.totalTime).toBeLessThan(1000);
    expect(result.opsPerSecond).toBeGreaterThan(10000);
  });

  it("should clone complex objects efficiently", () => {
    const complexObj = createTestData.complex();
    const iterations = 1000;

    const result = benchmark(
      "Complex Object Clone",
      () => clone(complexObj),
      iterations
    );
    performanceResults.complex = result;

    expect(result.totalTime).toBeLessThan(5000);
    expect(result.opsPerSecond).toBeGreaterThan(100);
  });

  it("should clone comprehensive objects with all data types efficiently", () => {
    const comprehensiveObj = createTestData.comprehensive();
    const iterations = 5000;

    const result = benchmark(
      "Comprehensive Object Clone",
      () => clone(comprehensiveObj),
      iterations
    );
    performanceResults.comprehensive = result;

    expect(result.totalTime).toBeLessThan(3000);
    expect(result.opsPerSecond).toBeGreaterThan(500);
  });

  it("should clone arrays efficiently", () => {
    const arr = createLargeArray(1000);
    const iterations = 100;

    const result = benchmark("Large Array Clone", () => clone(arr), iterations);
    performanceResults.array = result;

    expect(result.totalTime).toBeLessThan(5000);
    expect(result.opsPerSecond).toBeGreaterThan(10);
  });

  it("should clone deeply nested objects efficiently", () => {
    const deepObj = createComplexObject(8, 3);
    const iterations = 1000;

    const result = benchmark(
      "Deep Nested Object Clone",
      () => clone(deepObj),
      iterations
    );
    performanceResults.deepNested = result;

    expect(result.totalTime).toBeLessThan(15000);
    expect(result.opsPerSecond).toBeGreaterThan(50);
  });

  it("should handle circular references efficiently", () => {
    const obj = createTestData.circular();
    const iterations = 10000;

    const result = benchmark(
      "Circular Reference Clone",
      () => clone(obj),
      iterations
    );
    performanceResults.circular = result;

    expect(result.totalTime).toBeLessThan(1500);
    expect(result.opsPerSecond).toBeGreaterThan(5000);
  });

  it("should clone Maps efficiently", () => {
    const map = createTestData.map(1000);
    const iterations = 100;

    const result = benchmark(
      "Map Clone (1000 entries)",
      () => clone(map),
      iterations
    );
    performanceResults.map = result;

    expect(result.totalTime).toBeLessThan(3000);
    expect(result.opsPerSecond).toBeGreaterThan(20);
  });

  it("should clone Sets efficiently", () => {
    const set = createTestData.set(1000);
    const iterations = 100;

    const result = benchmark(
      "Set Clone (1000 items)",
      () => clone(set),
      iterations
    );
    performanceResults.set = result;

    expect(result.totalTime).toBeLessThan(3000);
    expect(result.opsPerSecond).toBeGreaterThan(20);
  });

  it("should clone functions efficiently", () => {
    const testFunc = createTestData.function();
    const iterations = 10000;

    const result = benchmark(
      "Function Clone",
      () => clone(testFunc),
      iterations
    );
    performanceResults.function = result;

    expect(result.totalTime).toBeLessThan(2000);
    expect(result.opsPerSecond).toBeGreaterThan(2000);
  });

  it("should clone Error objects efficiently", () => {
    const error = new Error("Test error");
    error.stack = "Custom stack trace";
    (error as any).customProp = "custom";

    const iterations = 10000;

    const time = measureTime(() => clone(error), iterations);
    console.log(
      `Error clone: ${time.toFixed(2)}ms for ${iterations} iterations`
    );
    console.log(`Average: ${(time / iterations).toFixed(4)}ms per clone`);

    expect(time).toBeLessThan(2000);
  });

  it("should clone Date objects efficiently", () => {
    const date = new Date();
    const iterations = 100000;

    const time = measureTime(() => clone(date), iterations);
    console.log(
      `Date clone: ${time.toFixed(2)}ms for ${iterations} iterations`
    );
    console.log(`Average: ${(time / iterations).toFixed(4)}ms per clone`);

    expect(time).toBeLessThan(500);
  });

  it("should clone RegExp objects efficiently", () => {
    const regex = /test[a-z]+/gi;
    const iterations = 100000;

    const time = measureTime(() => clone(regex), iterations);
    console.log(
      `RegExp clone: ${time.toFixed(2)}ms for ${iterations} iterations`
    );
    console.log(`Average: ${(time / iterations).toFixed(4)}ms per clone`);

    expect(time).toBeLessThan(500);
  });

  it("should clone ArrayBuffer efficiently", () => {
    const buffer = new ArrayBuffer(1024);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      view[i] = i % 256;
    }

    const iterations = 1000;

    const time = measureTime(() => clone(buffer), iterations);
    console.log(
      `ArrayBuffer clone (1KB): ${time.toFixed(
        2
      )}ms for ${iterations} iterations`
    );
    console.log(`Average: ${(time / iterations).toFixed(4)}ms per clone`);

    expect(time).toBeLessThan(1000);
  });

  it("should clone TypedArrays efficiently", () => {
    const typedArray = new Uint32Array(1000);
    for (let i = 0; i < typedArray.length; i++) {
      typedArray[i] = i;
    }

    const iterations = 1000;

    const time = measureTime(() => clone(typedArray), iterations);
    console.log(
      `TypedArray clone (1000 elements): ${time.toFixed(
        2
      )}ms for ${iterations} iterations`
    );
    console.log(`Average: ${(time / iterations).toFixed(4)}ms per clone`);

    expect(time).toBeLessThan(1000);
  });

  it("should compare performance with JSON.parse/stringify", () => {
    const obj = createComplexObject(5, 4);
    const iterations = 1000;

    const cloneResult = benchmark("Our Clone", () => clone(obj), iterations);

    const jsonResult = benchmark(
      "JSON Method",
      () => JSON.parse(JSON.stringify(obj)),
      iterations
    );

    console.log(`\n⚡ Performance Comparison:`);
    console.log(`Our clone: ${cloneResult.totalTime.toFixed(2)}ms`);
    console.log(`JSON method: ${jsonResult.totalTime.toFixed(2)}ms`);
    console.log(
      `Speed ratio: ${(cloneResult.totalTime / jsonResult.totalTime).toFixed(
        2
      )}x`
    );
    console.log(
      "Note: JSON method has limitations (no functions, dates become strings, etc.)"
    );

    performanceResults.jsonComparison = cloneResult;
    expect(cloneResult.totalTime).toBeLessThan(jsonResult.totalTime * 10);
  });

  it("should handle memory efficiently with large objects", () => {
    const largeObj = {
      arrays: Array.from({ length: 5 }, () => createLargeArray(100)),
      maps: Array.from({ length: 5 }, () => createTestData.map(100)),
      nested: createComplexObject(6, 3),
    };

    const iterations = 10;

    const result = benchmark(
      "Large Object Clone",
      () => clone(largeObj),
      iterations
    );
    performanceResults.memoryEfficiency = result;

    expect(result.totalTime).toBeLessThan(10000);
    expect(result.opsPerSecond).toBeGreaterThan(1);
  });

  it("should test memory usage analysis", () => {
    const iterations = 1000;
    const objects: any[] = [];
    const complexObj = createTestData.complex();

    const memoryAPI = (performance as any).memory;

    if (memoryAPI) {
      const startMemory = memoryAPI.usedJSHeapSize;

      benchmark(
        "Memory Usage Test",
        () => {
          objects.push(clone(complexObj));
        },
        iterations
      );

      const endMemory = memoryAPI.usedJSHeapSize;
      const memoryUsed = endMemory - startMemory;

      console.log(`\n💾 Memory Usage Analysis:`);
      console.log(
        `Memory used for ${iterations} clones: ${(
          memoryUsed /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
      console.log(
        `Average memory per clone: ${(memoryUsed / iterations / 1024).toFixed(
          2
        )} KB`
      );
      console.log(`Total objects cloned: ${objects.length}`);

      objects.length = 0;
      expect(memoryUsed).toBeGreaterThan(0);
    } else {
      console.log("💾 Memory usage data not available in this environment");

      benchmark(
        "Memory Usage Test (no memory API)",
        () => {
          objects.push(clone(complexObj));
        },
        iterations
      );

      objects.length = 0;
    }
  });

  it("should scale linearly with object size", () => {
    const sizes = [100, 500, 1000, 2000];
    const results: Array<{ size: number; time: number }> = [];

    console.log(`\n📊 Scaling Analysis:`);
    for (const size of sizes) {
      const obj = createLargeArray(size);
      const iterations = 100;

      const result = benchmark(`Size ${size}`, () => clone(obj), iterations);
      results.push({ size, time: result.totalTime });
    }

    // Check that scaling is roughly linear (allowing for some variation)
    const ratio1 = results[1].time / results[0].time;
    const ratio2 = results[2].time / results[1].time;
    const ratio3 = results[3].time / results[2].time;

    console.log(
      `Scaling ratios: ${ratio1.toFixed(2)}, ${ratio2.toFixed(
        2
      )}, ${ratio3.toFixed(2)}`
    );

    // Each doubling should be within reasonable bounds
    expect(ratio1).toBeLessThan(10);
    expect(ratio2).toBeLessThan(10);
    expect(ratio3).toBeLessThan(10);
  });

  it("should display comprehensive performance summary", () => {
    console.log(`\n🏆 Performance Summary`);
    console.log("=".repeat(70));
    console.log(
      "Operation".padEnd(25) +
        "Ops/sec".padEnd(15) +
        "Avg Time (ms)".padEnd(15) +
        "Total Time (ms)"
    );
    console.log("-".repeat(70));

    Object.entries(performanceResults).forEach(([name, result]) => {
      if (result) {
        console.log(
          name.padEnd(25) +
            result.opsPerSecond.toFixed(0).padEnd(15) +
            result.avgTime.toFixed(4).padEnd(15) +
            result.totalTime.toFixed(2)
        );
      }
    });

    console.log("-".repeat(70));
    console.log("✅ Performance analysis complete!");

    // This test always passes - it's just for displaying the summary
    expect(Object.keys(performanceResults).length).toBeGreaterThan(0);
  });
});
