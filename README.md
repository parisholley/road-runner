# Road Runner Router

[![travis](https://img.shields.io/travis/parisholley/road-runner)][travis]
![dependencies](https://img.shields.io/depfu/parisholley/road-runner)
[![version](https://img.shields.io/npm/v/@parisholley/road-runner)][npm]
[![coverage](https://img.shields.io/coveralls/github/parisholley/road-runner)][coveralls]
![size](https://img.shields.io/bundlephobia/min/@parisholley/road-runner)
![supported](https://img.shields.io/node/v/@parisholley/road-runner)

A router for when latency is Wile E. Coyote :) Inspired by
[julienschmidt/httprouter](https://github.com/julienschmidt/httprouter)
and partly derived from  
[steambap/koa-tree-router](https://www.npmjs.com/package/koa-tree-router).

## Why is it fast?

[![chart](https://github.com/parisholley/router-benchmark/raw/master/results.png)][chart]

* Params are detected and provided as objects, but no regex or value casting, strings only
* Case sensitive (use .toLowerCase() when inserting/retrieving if you want case-insensitivity)
* Limited validation (assuming you are going to pass in valid paths and HTTP methods)
* No URL parsing, most environments provide some type of req.path functionality

## Getting Started

The following snippet is the basic setup of the router, remember, it is
up to you to tie into your favorite HTTP library and execute the handler
code and return a response (if any):

```typescript
import {RoadRunner} from "@parisholley/road-runner";

const router = RoadRunner();

router.addRoute('GET', '/path', () => {});

// handler === {value: "() => {}", params: {}}
const result = router.lookupRoute('GET', '/path');

result.value();

router.addRoute('GET', '/path/:nested', () => {});

// handler === {value: "() => {}", params: {nested: 'foobar'}}
const result2 = router.lookupRoute('GET', '/path/foobar');

result2.value();
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
import {RoadRunner} from "@parisholley/road-runner";

const router = RoadRunner();

router.addRoute(`POST:2.1`, '/document/:id', () => {});

function doLookup(headers:Record<string,string>){
  const result = router.lookupRoute(`POST:${headers['version']}`, '/document/:id');
  
  result.value();
}
````

[chart]: https://github.com/parisholley/router-benchmark
[travis]: https://travis-ci.org/parisholley/road-runner
[npm]: https://www.npmjs.com/package/@parisholley/road-runner
[coveralls]: https://coveralls.io/github/parisholley/road-runner
