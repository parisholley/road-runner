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

  test('Should not be able to overlap wildcard with params', () => {
    const router = roadrunner();

    try {
      router.addRoute('GET', '/*', true);
      router.addRoute('GET', '/:param1', true);

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
