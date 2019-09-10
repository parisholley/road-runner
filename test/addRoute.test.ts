import {roadrunner} from '../src/index';

describe('standard type checking', () => {
  test('Bucket should be a string', () => {
    const router = roadrunner();

    try {
      router.addRoute(1 as any as string, '/foo', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Path should be a string', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', 1 as any as string, true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('The path should not be empty', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('The bucket should not be empty', () => {
    const router = roadrunner();

    try {
      router.addRoute('', '/foo', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('The first character of a path should be `/` or `*`', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', 'test', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Root route already defined.', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo', true);
      router.addRoute('GET', '/foo', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Can add nested param routes.', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo/bar', true)
      router.addRoute('GET', '/foo/bar/:param', true);
      router.addRoute('GET', '/foo/bar/:param/baz', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot add a shorter route later.', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo', true)
      router.addRoute('GET', '/fo', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Should not be able to overlap wildcard with params', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/*', true);
      router.addRoute('GET', '/:param1', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot put multiple params in segment', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/:param1-:param2/foobar', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot have blank param name', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/:', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot define dynamic after static', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/foo', true);
      router.addRoute('GET', '/:param1', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot define static after dynamic', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/;param1', true);
      router.addRoute('GET', '/foo', true);

      throw new Error('Should have thrown error.');
    } catch {

    }
  });

  test('Cannot change param names', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/:param1', true);
      router.addRoute('GET', '/:param2', true);

      throw new Error('Should have thrown error.');
    } catch {

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
    } catch {

    }
  });
});
