enum Type {
  STATIC, PARAM
}

export interface Result<V> {
  handle: V | null;
  params: Record<string, string>
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

const PARAM = ':';
const SLASH = '/';
const SLASH_CODE = SLASH.charCodeAt(0);

export class Node<V> {
  private indices: string;
  private children: Node<V>[];
  private childrenI: Record<string, Node<V>>;
  private path: string;
  private handle: V | null;
  private wildChild: boolean;
  private type: Type;
  private param: string;
  private pathLength: number;
  private childrenLength: number;

  constructor(config: Partial<Options<V>> = {}) {
    this.indices = config.indices || '';
    this.children = config.children || [];
    this.childrenI = config.childrenI || {};
    this.path = config.path || "";
    this.handle = config.handle || null;
    this.wildChild = config.wildChild || false;
    this.type = config.type || Type.STATIC;
    this.param = config.param || '';

    this.pathLength = this.path.length;
    this.childrenLength = this.children.length;
  }

  addRoute(fullPath: string, handle: V) {
    const params = this.countParams(fullPath);

    if (!this.isEmpty()) {
      this.onChunk(this, fullPath, fullPath, handle, params);
    } else {
      this.insertChild(fullPath, fullPath, handle, params);
    }
  }

  search(this: Node<V>, searchPath: string): Result<V> {
    let n = this;

    const params: Record<string, string> = {};

    walk: while (true) {
      // referring to length is technically a function call, cache it
      const searchPathLength = searchPath.length;

      if (searchPathLength > n.pathLength && searchPath.slice(0, n.pathLength) === n.path) {
        searchPath = searchPath.slice(n.pathLength);

        if (n.wildChild) {
          n = n.children[0];

          let end = 0;

          while (end < searchPathLength && searchPath.charCodeAt(end) !== SLASH_CODE) {
            end++;
          }

          const paramValue = searchPath.slice(0, end);

          if (!paramValue || !n.param) {
            return {handle: null, params};
          }

          if (n.param !== '!') {
            params[n.param] = paramValue;
          }

          // We need to go deeper!
          if (end < searchPathLength) {
            if (n.childrenLength === 0) {
              return {handle: null, params};
            }

            searchPath = searchPath.slice(end);

            n = n.children[0];

            continue walk;
          }

          return {handle: n.handle, params};
        }

        // If n node does not have a wildcard child, look up the next child node and continue to walk down the tree
        const c = searchPath.charCodeAt(0);

        for (let i = 0; i < n.indices.length; i++) {
          if (c === n.indices.charCodeAt(i)) {
            n = n.children[i];
            continue walk;
          }
        }
      } else if (searchPath === n.path) {
        return {handle: n.handle, params};
      }

      return {handle: null, params};
    }
  }

  private hasChildren() {
    return this.children.length > 0;
  }

  private insertChild(this: Node<V>, fullPath: string, childPath: string, handle: V | null, numParams: number) {
    let offset = 0; // Already handled chars of the path

    let n = this;

    // Find prefix until first wildcard
    for (let i = 0, max = childPath.length; numParams > 0; i++) {
      const c = childPath[i];
      if (c !== PARAM) {
        continue;
      }

      // Find wildcard end (either '/' or path end)
      let end = i + 1;
      while (end < max && childPath[end] !== "/") {
        if (childPath[end] === PARAM) {
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
      if (n.hasChildren()) {
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

        n = n.replaceChildren();
      }
    }

    // insert remaining path part and handle to the leaf
    n.replacePath(childPath.slice(offset));
    n.setHandle(handle);
  }

  private setHandle(newHandle: V | null) {
    this.handle = newHandle;
  }

  private replaceChildren(config: Partial<Options<V>> = {}) {
    const child = new Node<V>(config);

    if (config.type === Type.PARAM) {
      this.wildChild = true;
    }

    this.children = [child];
    this.childrenLength = 1;

    return child;
  }

  private replacePath(newPath: string) {
    if (newPath[0] === PARAM) {
      this.param = newPath.slice(1);
    }

    this.path = newPath;
    this.pathLength = newPath.length;
  }

  private isEmpty() {
    return !(this.path.length > 0 || this.children.length > 0);
  }

  private processCharacter(fullPath: string, childPath: string, handle: V, numParams: number) {
    const c = childPath[0];

    // Slash after param
    if (this.type === Type.PARAM && c === "/" && this.children.length === 1) {
      this.onChunk(this.children[0], fullPath, childPath, handle, numParams);

      return;
    }

    // Check if a child with the next path char exists
    const existing = this.childrenI[c.charCodeAt(0)];

    if (existing) {
      existing.onChunk(existing, fullPath, childPath, handle, numParams);

      return;
    }

    // Otherwise insert it
    if (c !== PARAM) {
      const child = new Node<V>({type: Type.STATIC});

      this.children.push(child);
      this.indices += c;
      this.childrenI[c.charCodeAt(0)] = child;
      this.childrenLength = this.children.length;

      child.insertChild(fullPath, childPath, handle, numParams);

      return;
    }

    this.insertChild(fullPath, childPath, handle, numParams);
  }

  private processWildcard(fullPath: string, childPath: string, handle: V, numParams: number) {
    const isMatch = childPath.length >= this.path.length &&
      this.path === childPath.slice(0, this.path.length) &&
      (this.path.length >= childPath.length || childPath[this.path.length] === "/");
    if (isMatch) {
      this.onChunk(this, fullPath, childPath, handle, numParams);

      return;
    }

    // Wildcard conflict
    const pathSeg = childPath.split("/")[0];

    const prefix =
      fullPath.slice(0, fullPath.indexOf(pathSeg)) + this.path;
    throw new Error(
      `'${pathSeg}' in new path '${fullPath}' conflicts with existing wildcard '${
        this.path
      }' in existing prefix '${prefix}'`
    );
  }

  private createNode(i: number, fullPath: string, childPath: string, handle: V, numParams: number) {
    const nextChildPath = childPath.slice(i);

    if (this.wildChild) {
      this.children[0].processWildcard(fullPath, nextChildPath, handle, numParams - 1);

      return;
    }

    this.processCharacter(fullPath, nextChildPath, handle, numParams);
  }

  private commonPrefixIndex(childPath: string) {
    // Find the longest common prefix
    // This also implies that the common prefix contains no PARAM
    // since the existing key can't contain those chars.
    let i = 0;
    const max = Math.min(childPath.length, this.path.length);

    while (i < max && this.path[i] === childPath[i]) {
      i++;
    }

    return i;
  }

  private split(i: number, childPath: string) {
    if (i < this.path.length) {
      const child = new Node<V>({
        path: this.path.slice(i),
        wildChild: this.wildChild,
        childrenI: this.childrenI,
        children: this.children,
        handle: this.handle,
        indices: this.indices
      });

      this.children = [child];
      this.indices = this.path[i];
      this.childrenI = {[this.indices.charCodeAt(0)]: child};
      this.childrenLength = 1;
      this.wildChild = false;
      this.path = childPath.slice(0, i);
      this.pathLength = this.path.length;
      this.handle = null;

      return true;
    }

    return false;
  }

  private onChunk(n: Node<V>, fullPath: string, childPath: string, fullPathHandle: V, numParams: number) {
    const i = n.commonPrefixIndex(childPath);

    const split = n.split(i, childPath);

    // Make new node a child of this node
    if (i < childPath.length) {
      n.createNode(i, fullPath, childPath, fullPathHandle, numParams);
    } else if (i === childPath.length) {
      // Make node a (in-path leaf)
      if (!split) {
        throw new Error('Route already defined.');
      }

      this.handle = fullPathHandle;
    }
  }

  private countParams(path: string) {
    let n = 0;
    for (let i = 0; i < path.length; i++) {
      if (path[i] !== PARAM) {
        continue;
      }
      n++;
    }

    return n;
  }
}
