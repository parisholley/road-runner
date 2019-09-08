export interface Router<V> {
  addRoute(bucket: string, path: string, value: V): void;

  findRoute(bucket: string, path: string): Result<V> | null;
}

export interface Result<V> {
  value: V;
  params: Record<string, string>;
}


export interface Options {
  ignoreTrailingSlash?: boolean;
  allowChangingParameterName?: boolean;
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

  // because string always starts with "/", [0] will always be an empty space
  split[0] = bucket;

  return split;
}

export default function roadrunner<V>({ignoreTrailingSlash, allowChangingParameterName}: Options = {}): Router<V> {
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

    let branch = dynamic;

    const params: Record<string, string> = {};
    const paramChunks: string[] = [];

    for (let i = 0; i < split.length; i++) {
      const chunk = split[i];

      if (chunk === '') {
        break;
      }

      const isLeaf = i == split.length - 1;

      let lookup = branch[chunk];

      if (!lookup || (isLeaf && lookup._routes)) {
        lookup = branch['*'];
      }

      if (lookup) {
        branch = lookup;

        const param = (branch._routes && branch._routes.param) || branch.param;

        if (param) {
          if (allowChangingParameterName) {
            paramChunks.push(chunk);
          } else {
            params[param] = chunk;
          }
        }

        if (isLeaf) {
          if (branch._routes) {
            branch = branch[''];
          }

          if (branch === undefined) {
            return null;
          }

          if (allowChangingParameterName && branch.params) {
            for (const index in paramChunks) {
              params[branch.params[index]] = paramChunks[index];
            }
          }

          return {
            value: branch.value,
            params
          }
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

      const existing = findRoute(bucket, path);

      if (existing) {
        const existingParams = Object.keys(existing.params).length;
        const inputParams = path.match(/:/g);

        // if path exists, it may be a static/dynamic overlap (which is allowed)
        if (existingParams <= (inputParams ? inputParams.length : 0)) {
          throw new Error('Route already defined.')
        }
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

      let params: string[] = [];

      for (let i = 0; i < split.length; i++) {
        const isParam = split[i].indexOf(':') === 0;
        let chunk = isParam ? '*' : split[i];

        if (chunk.includes('*') && chunk !== '*') {
          throw new Error('Wildcard must be by itself in path.');
        }

        if (chunk.includes(':') && chunk[0] !== ':') {
          throw new Error('Param must be by itself in path.');
        }

        const paramChunk = split[i].substring(1);

        if (isParam) {
          params.push(paramChunk);
        }

        const leafValue = {params, value};

        if (i === split.length - 1) {
          parent[chunk] = isParam ? {param: paramChunk, ...leafValue} : leafValue;
        } else if (!parent[chunk]) {
          const child = {_routes: isParam ? {param: paramChunk} : {path: split[i], ...leafValue}};
          parent[chunk] = child;

          parent = child;
        } else {
          const existing = parent[chunk];

          if (existing.param || !existing._routes) {
            const child = {_routes: isParam ? {param: paramChunk} : split[i], '': existing};

            parent[chunk] = child;

            parent = child;
          } else if (existing._routes) {
            parent = existing;
          }
        }

        params = params.slice(0);
      }
    },

    findRoute
  };
}
