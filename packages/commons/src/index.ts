import * as _ from './utils';

export { _ };

// Removes all leading and trailing slashes from a path
export function stripSlashes (name: string) {
  return name.replace(/^(\/+)|(\/+)$/g, '');
}

// Duck-checks if an object looks like a promise
export function isPromise (result: any) {
  return _.isObject(result) &&
    typeof result.then === 'function';
}

export function createSymbol (name: string) {
  return typeof Symbol !== 'undefined' ? Symbol(name) : name;
}
