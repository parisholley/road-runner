import {roadrunner} from '../src/index';

const generate = () => ({
  foo: Math.random() * 10000000000
});

describe('static routes', () => {
  test('Should find root path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/', value);

    expect(router.findRoute('GET', '/')).toEqual({
      params: {},
      value
    })
  });

  test('Should not find root path if bucket is mismatch', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/', value);

    expect(router.findRoute('POST', '/')).toBeNull();
  });

  test('Should not find root path if file is passed', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/', value);

    expect(router.findRoute('GET', '/foo')).toBeNull();
  });


  test('Should not find root path if folder is passed', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/', value);

    expect(router.findRoute('GET', '/foo/')).toBeNull();
  });


  test('Should find nested path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/bar', value);

    expect(router.findRoute('GET', '/foo/bar')).toEqual({
      params: {},
      value
    });
  });

  test('Should not find nested path if partial match', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/bar', value);

    expect(router.findRoute('GET', '/foo/ba')).toBeNull();
  });

  test('Should not find nested path if extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/bar', value);

    expect(router.findRoute('GET', '/foo/bar/')).toBeNull();
  });

  test('Should not find nested path if lookup is for nested folder', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/bar', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });
});

describe('params', () => {
  test('Should find root path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/:param1', value);

    expect(router.findRoute('GET', '/foo')).toEqual({
      params: {param1: 'foo'},
      value
    })
  });

  test('Should not find root path if wildcard is missing', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/:param1', value);

    expect(router.findRoute('GET', '/')).toBeNull();
  });

  test('Should find correct subpath', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/bah', generate());
    router.addRoute('GET', '/foo/:param1/baz', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toEqual({
      params: {param1: 'bar'},
      value
    });
  });

  test('Should not find missing subpath', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/bah', value);
    router.addRoute('GET', '/foo/:param1/baz', generate());

    expect(router.findRoute('GET', '/foo/bar/bum')).toBeNull();
  });

  test('Should enforce trailing slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/', value);

    expect(router.findRoute('GET', '/foo/baz')).toBeNull();

    expect(router.findRoute('GET', '/foo/baz/')).toEqual({
      params: {param1: 'baz'},
      value
    });
  });

  test('Should find nested path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1', value);

    expect(router.findRoute('GET', '/foo/baz')).toEqual({
      params: {param1: 'baz'},
      value
    });
  });

  test('Should not find nested path if param is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1', value);

    expect(router.findRoute('GET', '/foo/')).toBeNull();
  });

  test('Should not find nested path if lookup is a folder below', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1', value);

    expect(router.findRoute('GET', '/foo')).toBeNull();
  });

  test('Should not find nested path if lookup has extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/')).toBeNull();
  });

  test('Should not find nested path if lookup is for nested folder', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should find multiple param path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/baz/:param2', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum')).toEqual({
      params: {param1: 'bar', param2: 'bum'},
      value
    });
  });

  test('Should not find multiple param path if last wildcard is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/baz/:param2', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should not find multiple param path if lookup is a folder below', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/baz/:param2', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should not find multiple param path if lookup has extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/baz/:param2', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum/')).toBeNull();
  });

  test('Should not find multiple param path if lookup is for nested folder', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/:param1/baz/:param2', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum/bah')).toBeNull();
  });
});

describe('wildcards', () => {
  test('Should find root path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/*', value);

    expect(router.findRoute('GET', '/bar')).toEqual({
      params: {},
      value
    })
  });

  test('Should not find root path if wildcard is missing', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/*', value);

    expect(router.findRoute('GET', '/')).toBeNull();
  });

  test('Should find nested path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*', value);

    expect(router.findRoute('GET', '/foo/baz')).toEqual({
      params: {},
      value
    });
  });

  test('Should not find nested path if wildcard is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*', value);

    expect(router.findRoute('GET', '/foo/')).toBeNull();
  });

  test('Should not find nested path if lookup is a folder below', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*', value);

    expect(router.findRoute('GET', '/foo')).toBeNull();
  });

  test('Should not find nested path if lookup has extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*', value);

    expect(router.findRoute('GET', '/foo/bar/')).toBeNull();
  });

  test('Should not find nested path if lookup is for nested folder', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should find multiple wildcard path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/baz/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum')).toEqual({
      params: {},
      value
    });
  });

  test('Should not find multiple wildcard path if last wildcard is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/baz/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should not find multiple wildcard path if lookup is a folder below', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/baz/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toBeNull();
  });

  test('Should not find multiple wildcard path if lookup has extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/baz/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum/')).toBeNull();
  });

  test('Should not find multiple wildcard path if lookup is for nested folder', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/baz/*', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum/bah')).toBeNull();
  });
});

describe('mixed', () => {
  test('Should find path', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/baz')).toEqual({
      params: {param1: 'baz'},
      value
    });
  });

  test('Should not find path if wildcard is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/:param1', value);

    expect(router.findRoute('GET', '/foo//baz')).toBeNull();
  });

  test('Should not find path if param is missing value', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/')).toBeNull();
  });

  test('Should not find path if lookup is a folder below', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/baz/bum')).toBeNull();
  });

  test('Should not find nested path if lookup has extra slash', () => {
    const router = roadrunner();

    const value = generate();
    router.addRoute('GET', '/foo/*/:param1', value);

    expect(router.findRoute('GET', '/foo/bar/baz/')).toBeNull();
  });
});

test('kitchen sink', () => {
  const routes = [
    {path: '/', test: '/'},
    {path: '/foo/:param1', params: {param1: 'value'}, test: '/foo/value'}
  ];

  const router = roadrunner();

  for (const {path} of routes) {
    router.addRoute('GET', path, path);
  }

  for (const {params = {}, path, test} of routes) {
    const result = router.findRoute('GET', test);

    expect(result).toEqual({
      value: path,
      params
    })
  }
});
