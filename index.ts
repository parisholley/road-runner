export interface Router<V> {
  addRoute(bucket: string, path: string, value: V): void;

  findRoute(bucket: string, path: string): Result<V> | null;
}

export interface Result<V> {
  value: V;
  params?: Record<string, string>;
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

  if (split[0] === '') {
    // if "/..."
    split[0] = bucket;
  } else {
    split.unshift(bucket);
  }

  return split;
}

export default function roadrunner<V>({ignoreTrailingSlash}: { ignoreTrailingSlash?: boolean } = {}): Router<V> {
  const dynamic: Record<string, any> = {};
  const nonDynamic: Record<string, any> = {};

  let cleanPath = (path: string) => path;

  if (ignoreTrailingSlash) {
    cleanPath = (path: string) => {
      let real = path;

      if (real[real.length - 1] === '/') {
        return real.substring(0, real.length - 1);
      }

      return real;
    }
  }

  const findRoute = (bucket: string, path: string): Result<V> | null => {
    typeCheck(bucket, path);

    const realPath = cleanPath(path);

    let result = nonDynamic[bucket] && nonDynamic[bucket][realPath];

    if (result) {
      return {
        value: result,
        params: {}
      };
    }

    const split = splitPath(bucket, realPath);

    let leaf = dynamic;

    const params: Record<string, string> = {};

    for (let i = 0; i < split.length; i++) {
      const chunk = split[i];

      if (chunk === '') {
        break;
      }

      const lookup = leaf[chunk] || leaf['*'];

      if (lookup) {
        leaf = lookup;

        if (i == split.length - 1) {
          if (leaf._routes) {
            result = leaf[''];

            if (leaf._routes.param) {
              params[leaf._routes.param] = chunk;
            }
          } else if (leaf.param) {
            params[leaf.param] = chunk;
            result = leaf.value;
          } else {
            result = leaf;
          }

          if (result === undefined) {
            return null;
          }

          return {
            value: result,
            params
          }
        } else if (leaf.param) {
          params[leaf.param] = chunk;
        } else if (leaf._routes && leaf._routes.param) {
          params[leaf._routes.param] = chunk;
        }
      } else {
        break;
      }
    }

    return null;
  };

  return {
    addRoute: (bucket: string, path: string, value: V): void => {
      typeCheck(bucket, path);

      // only check when building routes for performance, assume user will pass in correct values on lookup
      if (path[0] !== '/' && path[0] !== '*') {
        throw new Error('The first character of a path should be `/` or `*`.');
      }

      if (findRoute(bucket, path)) {
        throw new Error('Route already defined.')
      }

      const realPath = cleanPath(path);

      if (!nonDynamic[bucket]) {
        nonDynamic[bucket] = {};
      }

      nonDynamic[bucket][realPath] = value;

      if (!realPath.includes(':') && !realPath.includes('*')) {
        return;
      }

      const split = splitPath(bucket, realPath);

      let parent = dynamic;

      for (let i = 0; i < split.length; i++) {
        const isParam = split[i].indexOf(':') === 0;
        let chunk = isParam ? '*' : split[i];
        let leaf: string | object = split[i];

        if (chunk.includes('*') && chunk !== '*') {
          throw new Error('Wildcard must be by itself in path.');
        }

        if (chunk.includes(':') && chunk[0] !== ':') {
          throw new Error('Param must be by itself in path.');
        }

        if (i === split.length - 1) {
          parent[chunk] = isParam ? {param: split[i].substring(1), value} : value;
        } else if (!parent[chunk]) {
          const child = {_routes: isParam ? {param: split[i].substring(1)} : leaf};
          parent[chunk] = child;

          parent = child;
        } else {
          const existing = parent[chunk];

          if (existing._routes) {
            parent = existing;
          } else if (existing.param) {
            const child = {_routes: existing, '': existing.value};

            parent[chunk] = child;

            parent = child;
          } else {
            const child = {'': existing};

            parent[chunk] = child;

            parent = child;
          }
        }
      }
    },

    findRoute
  };
}
