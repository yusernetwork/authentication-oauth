export type KeyValueCallback<T> = (value: any, key: string) => T;

export function each (obj: any, callback: KeyValueCallback<void>) {
  if (obj && typeof obj.forEach === 'function') {
    obj.forEach(callback);
  } else if (isObject(obj)) {
    Object.keys(obj).forEach(key => callback(obj[key], key));
  }
}

export function some (value: any, callback: KeyValueCallback<boolean>) {
  return Object.keys(value)
    .map(key => [ value[key], key ])
    .some(([val, key]) => callback(val, key));
}

export function every (value: any, callback: KeyValueCallback<boolean>) {
  return Object.keys(value)
    .map(key => [ value[key], key ])
    .every(([val, key]) => callback(val, key));
}

export function keys (obj: any) {
  return Object.keys(obj);
}

export function values (obj: any) {
  return keys(obj).map(key => obj[key]);
}

export function isMatch (obj: any, item: any) {
  return keys(item).every(key => obj[key] === item[key]);
}

export function isEmpty (obj: any) {
  return keys(obj).length === 0;
}

export function isObject (item: any) {
  return (typeof item === 'object' && !Array.isArray(item) && item !== null);
}

export function isObjectOrArray (value: any) {
  return typeof value === 'object' && value !== null;
}

export function extend (first: any, ...rest: any[]) {
  return Object.assign(first, ...rest);
}

export function omit (obj: any, ...keys: string[]) {
  const result = extend({}, obj);
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick (source: any, ...keys: string[]) {
  return keys.reduce((result: { [key: string]: any }, key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }

    return result;
  }, {});
}

// Recursively merge the source object into the target object
export function merge (target: any, source: any) {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }

        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return target;
}
