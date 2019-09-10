enum Type {
  STATIC, ROOT, PARAM, CATCH_ALL
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

const statics: Record<string, any> = {};

interface Result<V> {
  handle: V | null;
  params: Record<string, string>
}

export interface Node<V> {
  commonPrefixIndex(fullPath: string): number;

  addRoute(path: string, handle: V, fullPath?: string, numParams?: number): void;

  search(path: string): Result<V>;

  searchWildcard(searchPath: string, searchPathLength: number): Result<V>;

  isEmpty(): boolean;

  split(i: number, fullPath: string, numParams: number): boolean;

  processWildcard(fullPath: string, childPath: string, handle: V, numParams: number): void;

  processCharacter(childPath: string, fullPath: string, handle: V, numParams: number): void;

  setHandle(newHandle: V | null): void;

  hasChildren(): boolean;

  onChunk(n: Node<V>, fullPath: string, childPath: string, handle: V, numParams: number): void;

  replacePath(newPath: string): void;

  replaceChildren(config: Partial<Options<V>>, indices?: string): Node<V>;

  createNode(i: number, fullPath: string, childPath: string, handle: V, numParams: number): void;

  insertChild(fullPath: string, childPath: string, handle: V | null, numParams: number): void;
}

interface Options<V> {
  indices: string;
  children: Node<V>[];
  childrenI: Record<string, Node<V>>;
  path: string;
  handle: V | null;
  wildChild: boolean;
  type: Type;
  param: string;
}

export function createNode<V>(config: Partial<Options<V>> = {}): Node<V> {
  let children: Node<V>[] = config.children || [];
  let childrenI: Record<string, Node<V>> = config.childrenI || {};
  let path: string = config.path || "";
  let handle: V | null = config.handle || null;
  let wildChild: boolean = config.wildChild || false;
  let type: Type = config.type || Type.STATIC;
  let param: string | undefined = config.param;
  let pathLength = path.length;
  let childrenLength = children.length;

  return {
    hasChildren() {
      return children.length > 0;
    },
    insertChild(fullPath: string, childPath: string, handle: V | null, numParams: number) {
      let offset = 0; // Already handled chars of the path

      let n = this;

      // Find prefix until first wildcard
      for (let i = 0, max = childPath.length; numParams > 0; i++) {
        const c = childPath[i];
        if (c !== ":" && c !== "*") {
          continue;
        }

        // Find wildcard end (either '/' or path end)
        let end = i + 1;
        while (end < max && childPath[end] !== "/") {
          if (childPath[end] === ":" || childPath[end] === "*") {
            throw new Error(
              "only one wildcard per path segment is allowed, has: '" +
              childPath.slice(i) +
              "' in path '" +
              fullPath +
              "'"
            );
          } else {
            end++;
          }
        }

        // Check if this Node existing children which would be unreachable
        // if we insert the wildcard here
        if (n.hasChildren() && end !== max) {
          throw new Error(
            "wildcard route '" +
            childPath.slice(i, end) +
            "' conflicts with existing children in path '" +
            fullPath +
            "'"
          );
        }

        // check if the wildcard has a name
        if (end - i < 2) {
          throw new Error(
            "wildcards must be named with a non-empty name in path '" +
            fullPath +
            "'"
          );
        }

        if (c === ":") {
          // Split path at the beginning of the wildcard
          if (i > 0) {
            n.replacePath(childPath.slice(offset, i));
            offset = i;
          }

          n = n.replaceChildren({type: Type.PARAM});
          numParams--;
          if (end < max) {
            n.replacePath(childPath.slice(offset, end));
            offset = end;

            n = n.replaceChildren({type: Type.STATIC});
          }
        } else {
          if (end !== max || numParams > 1) {
            throw new Error(
              "catch-all routes are only allowed at the end of the path in path '" +
              fullPath +
              "'"
            );
          }

          if (path.length > 0 && path[path.length - 1] === "/") {
            throw new Error(
              "catch-all conflicts with existing handle for the path segment root in path '" +
              fullPath +
              "'"
            );
          }

          i--;
          if (childPath[i] !== "/") {
            throw new Error("no / before catch-all in path '" + fullPath + "'");
          }

          this.replacePath(childPath.slice(offset, i));

          // first node: catchAll node with empty path
          const replaced = this.replaceChildren({type: Type.CATCH_ALL, wildChild: true}, childPath[i]);

          // second node: node holding the variable
          replaced.replaceChildren({path: childPath.slice(i), type: Type.CATCH_ALL, handle});

          return;
        }
      }

      // insert remaining path part and handle to the leaf
      n.replacePath(childPath.slice(offset));
      n.setHandle(handle);
    },
    setHandle(newHandle: V) {
      handle = newHandle;
    },
    replaceChildren(config: Partial<Options<V>>) {
      const child = createNode<V>(config);

      if (config.type === Type.PARAM) {
        wildChild = true;
      }

      children = [child];
      childrenLength = 1;

      return child;
    },
    replacePath(newPath: string) {
      if (newPath[0] === ':') {
        param = newPath.slice(1);
      }

      path = newPath;
      pathLength = newPath.length;
    },
    isEmpty() {
      return !(path.length > 0 || children.length > 0);
    },
    processCharacter(fullPath: string, childPath: string, handle: V, numParams: number) {
      const c = childPath[0];

      // Slash after param
      if (type === Type.PARAM && c === "/" && children.length === 1) {
        this.onChunk(children[0], fullPath, childPath, handle, numParams);

        return;
      }

      // Check if a child with the next path char exists
      const existing = childrenI[c.charCodeAt(0)];

      if (existing) {
        existing.onChunk(existing, fullPath, childPath, handle, numParams);

        return;
      }

      // Otherwise insert it
      if (c !== ":" && c !== "*") {
        const child = createNode<V>({type: Type.STATIC});

        children.push(child);
        childrenI[c.charCodeAt(0)] = child;
        childrenLength = children.length;

        child.insertChild(fullPath, childPath, handle, numParams);

        return;
      }

      this.insertChild(fullPath, childPath, handle, numParams);
    },
    processWildcard(fullPath: string, childPath: string, handle: V, numParams: number) {
      const isMatch = childPath.length >= path.length &&
        path === childPath.slice(0, path.length) &&
        (path.length >= childPath.length || childPath[path.length] === "/");
      if (isMatch) {
        this.onChunk(this, fullPath, childPath, handle, numParams);

        return;
      }

      // Wildcard conflict
      let pathSeg = "";
      if (type === Type.CATCH_ALL) {
        pathSeg = childPath;
      } else {
        pathSeg = childPath.split("/")[0];
      }
      const prefix =
        fullPath.slice(0, fullPath.indexOf(pathSeg)) + path;
      throw new Error(
        `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${
          path
        }' in existing prefix '${prefix}'`
      );
    },
    createNode(i: number, fullPath: string, childPath: string, handle: V, numParams: number) {
      const nextChildPath = childPath.slice(i);

      if (wildChild) {
        children[0].processWildcard(fullPath, nextChildPath, handle, numParams - 1);

        return;
      }

      this.processCharacter(fullPath, nextChildPath, handle, numParams);
    },
    commonPrefixIndex(childPath: string) {
      // Find the longest common prefix
      // This also implies that the common prefix contains no ':' or '*'
      // since the existing key can't contain those chars.
      let i = 0;
      const max = Math.min(childPath.length, path.length);

      while (i < max && path[i] === childPath[i]) {
        i++;
      }

      return i;
    },
    split(i: number, childPath: string) {
      if (i < path.length) {
        const child = createNode({
          path: path.slice(i),
          wildChild,
          type: Type.STATIC,
          childrenI,
          children,
          handle
        });

        children = [child];
        childrenI = {[path[i].charCodeAt(0)]: child};
        childrenLength = 1;
        wildChild = false;
        path = childPath.slice(0, i);
        handle = null;

        return true;
      }

      return false;
    },
    onChunk(n: Node<V>, fullPath: string, childPath: string, fullPathHandle: V, numParams: number) {
      const i = n.commonPrefixIndex(childPath);

      const split = n.split(i, childPath, numParams);

      // Make new node a child of this node
      if (i < childPath.length) {
        n.createNode(i, fullPath, childPath, fullPathHandle, numParams);
      } else if (i === childPath.length) {
        // Make node a (in-path leaf)
        if (!split) {
          throw new Error('Route already defined.');
        }

        handle = fullPathHandle;
      }
    },
    addRoute(fullPath: string, handle: V) {
      const params = countParams(fullPath);

      if (!this.isEmpty()) {
        this.onChunk(this, fullPath, fullPath, handle, params);
      } else {
        this.insertChild(fullPath, fullPath, handle, params);
        type = Type.ROOT;
      }
    },
    search(searchPath: string) {
      // referring to length is technically a function call, cache it
      const searchPathLength = searchPath.length;

      if (searchPathLength > pathLength && searchPath.slice(0, pathLength) === path) {
        searchPath = searchPath.slice(pathLength);

        if (wildChild) {
          return children[0].searchWildcard(searchPath, searchPathLength);
        }

        // If this node does not have a wildcard child, look up the next child node and continue to walk down the tree
        const c = searchPath.charCodeAt(0);

        const child = childrenI[c];

        if (child) {
          return child.search(searchPath);
        }
      } else if (searchPath === path) {
        return {handle, params: {}};
      }

      return {handle: null, params: {}};
    },
    searchWildcard(searchPath: string, searchPathLength: number) {
      switch (type) {
        case Type.PARAM:
          // Find param end
          let end = 0;

          while (end < searchPathLength && searchPath.charCodeAt(end) !== 47) {
            end++;
          }

          const paramValue = searchPath.slice(0, end);

          if (!paramValue || !param) {
            return {handle: null, params: {}};
          }

          // We need to go deeper!
          if (end < searchPathLength) {
            if (childrenLength === 0) {
              return {handle: null, params: {}};
            }

            searchPath = searchPath.slice(end);

            const deeper = children[0].search(searchPath);

            if (!deeper) {
              return {handle: null, params: {}};
            }

            if (param !== '!') {
              deeper.params[param] = paramValue;
            }

            return deeper;
          }

          const params: Record<string, string> = {};

          if (param !== '!') {
            params[param] = paramValue;
          }

          return {handle, params};

        case Type.CATCH_ALL:
          return {handle, params: {[path.slice(2)]: searchPath}};

        default:
          throw new Error("invalid node type");
      }
    }
  }
}
