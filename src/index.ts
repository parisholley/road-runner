import {Node, Result} from "./node";

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

export class RoadRunner<V> {
  private buckets: Record<string, Node<V>> = {};

  addRoute(bucket: string, path: string, value: V): void {
    typeCheck(bucket, path);

    // only check when building routes for performance, assume user will pass in correct values on lookup
    if (path[0] !== '/' && path[0] !== '*') {
      throw new Error('The first character of a path should be `/` or `*`.');
    }

    // convert wildcards into params (we suppress them from output later)
    path = path.replace(/\*([A-z0-9]+)?\//g, ':!/').replace(/\*$/g, ':!');

    if (!this.buckets[bucket]) {
      this.buckets[bucket] = new Node();
    }

    this.buckets[bucket].addRoute(path, value);
  }

  findRoute(bucket: string, path: string): Result<V> | null {
    typeCheck(bucket, path);

    if (!this.buckets[bucket]) {
      return null;
    }

    const dynamic = this.buckets[bucket].search(path);

    if (!dynamic.value) {
      return null;
    }

    return dynamic;
  }
}
