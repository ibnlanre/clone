function reflect(obj, newObj, cyclic) {
  let eachKey = (key) => {
    let descriptor = Object.getOwnPropertyDescriptor(
      newObj,
      key
    ) as PropertyDescriptor;
    if (!(key in newObj) || descriptor.writable) {
      newObj[key] = Array.isArray(obj[key])
        ? obj[key].map((e) => copy(e, cyclic))
        : copy(obj[key], cyclic);
    }
  };

  let proto = Object.getPrototypeOf(obj);
  Reflect.ownKeys(proto)
    .filter((key) => !(key in newObj))
    .concat(Reflect.ownKeys(obj))
    .forEach((key) => eachKey(key));
}

function copy(obj, cyclic = new Map()) {
  try {
    if (cyclic.has(obj)) return cyclic.get(obj);
    if (!obj || !(obj instanceof Object)) return obj;
    let newObj = create(obj);
    reflect(obj, newObj, cyclic.set(obj, newObj));
    return newObj;
  } catch {
    return obj;
  }
}

let create = (obj) => {
  const value = obj.constructor.name;
  const node = global.Buffer && Buffer.isBuffer(obj);
  const buf = [obj.buffer, obj.byteOffset, obj.length];

  const func = (fn: Function) => (fn.name + "=" ?? "") + fn;
  return value === "ArrayBuffer"
    ? obj.slice()
    : value === "Date"
    ? new Date().setTime(obj.getTime())
    : value === "RegExp"
    ? new RegExp(obj.source, (/\w+$/.exec(obj) || "") as string)
    : "buffer" in obj
    ? (node ? Buffer.from : new obj.constructor())(...buf)
    : obj instanceof Function
    ? new Function(`return (${func(obj)})`)()
    : new obj.constructor();
};

/**
 * @description Deep clone any JavaScript native type.
 * @param item value to perform the function on
 */
const clone = <T>(item: T): T => copy(item);
export default clone;
