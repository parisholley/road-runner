import {createNode, Node} from "./node";

export interface Options {
  ignoreTrailingSlash?: boolean;
}

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

function splitPath(bucket: string, path: string) {
  const split = path.split('/');

  // because string always starts with "/", so stick bucket in first segment
  split.shift();
  split[0] = `${split[0]}${bucket}`;

  return split;
}

function countParams(path: string) {
  let n = 0;
  for (let i = 0; i < path.length; i++) {
    if (path[i] !== ":" && path[i] !== "*") {
      continue;
    }
    n++;
  }

  return n;
}

export function roadrunner<V>({ignoreTrailingSlash}: Options = {}): Router<V> {
  const buckets: Record<string, Node<V>> = {};

  const cleanPath = (path: string) => {
    let real = path;

    if (ignoreTrailingSlash && real[real.length - 1] === '/') {
      return real.substring(0, real.length - 1);
    }

    return real;
  };

  const findRoute = (bucket: string, path: string): Result<V> | null => {
    typeCheck(bucket, path);

    const realPath = cleanPath(path);

    let result = buckets[bucket] && buckets[bucket].search(realPath);

    if (!result || !result.handle) {
      return null;
    }

    if (result) {
      return {
        value: result.handle,
        params: result.params
      };
    }

    return null;
  };

  let priority = 0;
  let path;
  let children;

  return {
    addRoute: (bucket: string, path: string, value: V): void => {
      typeCheck(bucket, path);

      // only check when building routes for performance, assume user will pass in correct values on lookup
      if (path[0] !== '/' && path[0] !== '*') {
        throw new Error('The first character of a path should be `/` or `*`.');
      }

      let realPath = cleanPath(path);

      realPath = realPath.replace(/\*([A-z0-9]+)?\//g, ':!/').replace(/\*$/g, ':!');

      if (!buckets[bucket]) {
        buckets[bucket] = createNode();
      }

      buckets[bucket].addRoute(realPath, value);

      const test = 1;

      /*


      let fullPath = path;
      priority+=1;
      let numParams = countParams(path);

      nonDynamic[bucket][realPath] = value;

      if (!realPath.includes(':') && !realPath.includes('*')) {
        return;
      }

      const split = splitPath(bucket, realPath);

      let parent = dynamic;

      let params: string[] = [];

      for (let i = 0; i < split.length; i++) {
        const isParam = split[i].indexOf(':') === 0;
        const chunk = isParam ? '*' : split[i];

        if (chunk.includes('*') && chunk !== '*') {
          throw new Error('Wildcard must be by itself in path.');
        }

        if (chunk.includes(':') && chunk[0] !== ':') {
          throw new Error('Param must be by itself in path.');
        }

        let paramChunk: null | string = null;

        if (isParam) {
          paramChunk = split[i].substring(1);
          params.push(paramChunk);
        }

        if (i === split.length - 1) {
          parent[chunk] = {value, param: paramChunk, params};
        } else {
          const existing = parent[chunk];

          if (existing) {
            parent = existing;
          } else {
            const child = {param: paramChunk};
            parent[chunk] = child;

            parent = child;
          }
        }

        params = params.slice(0);
      }
       */
    },

    findRoute
  };
}
