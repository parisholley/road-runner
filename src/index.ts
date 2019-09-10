import {Node} from "./node";

export interface Router<V> {
  addRoute(bucket: string, path: string, value: V): void;

  findRoute(bucket: string, path: string): Result<V> | null;
}

export interface Result<V> {
  value: V;
  params: Record<string, string>;
}

function typeCheck(bucket: string, path: string) {
  if (!path) {
    throw new Error('Path is required.');
  }

  if (!bucket) {
    throw new Error('Bucket is required.');
  }

  // when used outside of typescript, it is possible for user to pass in the wrong parameters
  if (typeof bucket !== 'string') {
    throw new Error('Bucket should be a string.');
  }

  if (typeof path !== 'string') {
    throw new Error('Path should be a string.');
  }
}

export function roadrunner<V>(): Router<V> {
  const buckets: Record<string, Node<V>> = {};

  return {
    addRoute: (bucket: string, path: string, value: V): void => {
      typeCheck(bucket, path);

      // only check when building routes for performance, assume user will pass in correct values on lookup
      if (path[0] !== '/' && path[0] !== '*') {
        throw new Error('The first character of a path should be `/` or `*`.');
      }

      // convert wildcards into params (we suppress them from output later)
      path = path.replace(/\*([A-z0-9]+)?\//g, ':!/').replace(/\*$/g, ':!');

      if (!buckets[bucket]) {
        buckets[bucket] = new Node();
      }

      buckets[bucket].addRoute(path, value);
    },

    findRoute: (bucket: string, path: string): Result<V> | null => {
      typeCheck(bucket, path);

      if (!buckets[bucket]) {
        return null;
      }

      const dynamic = buckets[bucket].search(path);

      if (!dynamic.handle) {
        return null;
      }

      return {
        value: dynamic.handle,
        params: dynamic.params
      };
    }
  };
}
