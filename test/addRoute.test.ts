import roadrunner = require("../index");

describe('standard type checking', () => {
  test('Bucket should be a string', () => {
    const router = roadrunner();

    try {
      router.addRoute(1 as any as string, '/foo', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Bucket should be a string.');
    }
  });

  test('Path should be a string', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', 1 as any as string, true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Path should be a string.');
    }
  });

  test('The path should not be empty', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Path is required.');
    }
  });

  test('The bucket should not be empty', () => {
    const router = roadrunner();

    try {
      router.addRoute('', '/foo', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Bucket is required.');
    }
  });

  test('The first character of a path should be `/` or `*`', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', 'test', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('The first character of a path should be `/` or `*`.');
    }
  });

  test('Root route already defined.', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo', true);
      router.addRoute('GET', '/foo', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Route already defined.');
    }
  });

  test('Root route not already defined for different bucket.', () => {
    const router = roadrunner();
    router.addRoute('GET', '/foo', true);
    router.addRoute('POST', '/foo', true);
  });

  test('Nested route already defined.', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo/bar', true);
      router.addRoute('GET', '/foo/bar', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Route already defined.');
    }
  });

  test('Wildcard must be isolated', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo/*bar/', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Wildcard must be by itself in path.');
    }
  });

  test('Param must be isolated', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo/test:bar/', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Param must be by itself in path.');
    }
  });
});

describe('ignoreTrailingSlash', () => {
  test('Root route already defined (ignoreTrailingSlash: false).', () => {
    const router = roadrunner({ignoreTrailingSlash: false});

    router.addRoute('GET', '/foo', true);
    router.addRoute('GET', '/foo/', true);
  });

  test('Root route already defined (ignoreTrailingSlash: true).', () => {
    const router = roadrunner({ignoreTrailingSlash: true});

    try {
      router.addRoute('GET', '/foo', true);
      router.addRoute('GET', '/foo/', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Route already defined.');
    }
  });

  test('Nested route already defined (ignoreTrailingSlash: false).', () => {
    const router = roadrunner({ignoreTrailingSlash: false});

    router.addRoute('GET', '/foo/bar', true);
    router.addRoute('GET', '/foo/bar/', true);
  });

  test('Nested route already defined (ignoreTrailingSlash: true).', () => {
    const router = roadrunner({ignoreTrailingSlash: true});

    try {
      router.addRoute('GET', '/foo/bar', true);
      router.addRoute('GET', '/foo/bar/', true);

      throw new Error('Should have thrown error.');
    } catch (e) {
      expect(e.message).toEqual('Route already defined.');
    }
  });
});
