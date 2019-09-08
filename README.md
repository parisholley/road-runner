# Road Runner Router

A router for when latency is Wile. E. Coyote :)

## Why is it fast?

* Params are detected and provided as objects, but no regex or value casting, strings only
* Case sensitive (use .toLowerCase() when inserting/retrieving if you want case-insensitivity)
* Limited validation (assuming you are going to pass in valid paths and HTTP methods)
* No URL parsing, most environments provide some type of req.path functionality

## Why another router?

Node.JS has made [continous improvements](https://v8.dev/blog/fast-properties)
to the VM for leveraging plain objects as caches/lookup mechanisms.
Many routers use complex structures to workaround poor performance on
older versions and often include more functionality than required.

The goals of this very simple router project are:

* Require any new CPU bound functionality be opt-in (using options).
* Require any new changes not degrade base performance (eg: static routes).

## Getting Started

The following snippet is the basic setup of the router, remember, it is
up to you to tie into your favorite HTTP library and execute the handler
code and return a response (if any):

```typescript
import roadrunner from "@parisholley/road-runner";

const router = roadrunner();

router.addRoute('GET', '/path', () => {});

// handler === "() => {}"
const handler = router.lookupRoute('GET', '/path');

handler();
```

## Options

### `ignoreTrailingSlash` (boolean, default = false)

When enabled you can access the same path regardless of a trailing slash
existing in the lookup path.

```typescript
import roadrunner from "@parisholley/road-runner";

const router = roadrunner();

router.addRoute('GET', '/path', () => {});

router.lookupRoute('GET', '/path');
router.lookupRoute('GET', '/path/');
```

## Supported Path Syntax

* /foo
* /:foo
* /*
* /foo/:bar
* /foo/\*
* /foo/:bar/baz
* /foo/\*/baz
* /foo/:bar/baz/:bum
* /foo/\*/baz/\*
* /foo/:bar/baz/\*
* /foo/*/baz/:bum

## Unsupported Path  Syntax

* /foo/:bar-:baz
* /foo/bar:baz
* /foo/bar-*

## API Versioning

This library categorizes paths into `buckets`, which ultimately are up
to you to decide the format of. Most developers will likely pass in the
`HTTP Method` when adding routes, but you can choose any string value
you would like. In the case of switching behavior based on an API
version provided in the header, you could do something like this:

```typescript
import roadrunner from "@parisholley/road-runner";

const router = roadrunner();

router.addRoute(`POST:2.1`, '/document/:id', () => {});

function doLookup(headers:Record<string,string>){
  const handler = router.lookupRoute(`POST:${headers['version']}`, '/document/:id');
  
  handler();
}
````
