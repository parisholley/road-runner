import roadrunner from './index';
import assert from 'assert';

const router = roadrunner();

const routes = [
  {method: 'GET', url: '/user'},
  {method: 'GET', url: '/user/comments'},
  {method: 'GET', url: '/user/avatar'},
  {
    method: 'GET',
    url: '/user/lookup/username/:username',
    test: '/user/lookup/username/bob',
    params: {
      username: 'bob'
    }
  },
  {
    method: 'GET',
    url: '/user/lookup/email/:address',
    test: '/user/lookup/email/foo@bar.com',
    params: {
      address: 'foo@bar.com'
    }
  },
  {
    method: 'GET',
    url: '/event/:id',
    test: '/event/1',
    params: {
      id: '1'
    }
  },
  {
    method: 'GET',
    url: '/event/:id/comments',
    test: '/event/2/comments',
    params: {
      id: '2'
    }
  },
  {
    method: 'POST',
    url: '/event/:id/comments',
    test: '/event/3/comments',
    params: {
      id: '3'
    }
  },
  {
    method: 'GET',
    url: '/map/:location/events',
    test: '/map/GA/events',
    params: {
      location: 'GA'
    }
  },
  {method: 'GET', url: '/status'},
  {method: 'GET', url: '/very/deeply/nested/route/hello/there'},
  {
    method: 'GET',
    url: '/static/*',
    test: '/static/foobar'
  }
];

for (const route of routes) {
  router.addRoute(route.method, route.url, `=${route.url}`);
}

for (const route of routes) {
  const result = router.findRoute(route.method, route.test || route.url);

  const expected: any = {
    value: `=${route.url}`,
    params: route.params || {}
  };

  assert.deepStrictEqual(result, expected);
}
