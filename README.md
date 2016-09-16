# auto-trace
A library that fixes all your stack trace problems.

This library helps transform garbage errors into beautiful objects filled with insight and understanding. This is especially useful for apps that use an error reporting service such as bug-snag or sentry.

- Provide a meaningful Stack Trace (for optimum error blameage)
- Prevent irresponsible throwing of Non-Error objects
- Attach extra context to errors
- Encourage a consistent pattern for error handling

Resource File
```js
return $http
  .get()
  .then()
  .catch(throwAsyncStacktrace(extraContext))
```

Observable
```js
return observable
  .then()
  .catch(throwAsyncStacktrace(extraContext))
```

## Error Life cycle
There are two parts to the error life cycle
- Error Created `new Error()`
- Error Thrown `throw err`

These events do not always occur at the same time. $http is an example of this. Since $http makes an async request, an error stacktrace will contain the call stack of the invoker as the request comes in (this is the syncStacktrace). Often the more useful stacktrace is the call stack as the request went out `Controller->Service->Resource` (this is the asyncStacktrace).

#API

##Asynchronous Stack-Trace
The asynchronous stacktrace is often the most useful, in the case of http requests, this is the stacktrace as the request is going out.

###asyncStacktrace(callback, extraContext)
Returns a function that will wrap the caught response in an error object that contains the asynchronous stacktrace. Will append `extraContext` and call callback with wrapped error.
- `callback` (optional) function that will be called with the wrapped error
- `extraContext` (optional) String or Object that will be stringified and appended to the error message

```js
return $http
  .get()
  .then()
  .catch(asyncStacktrace(callback, {state: 'extra info'}))
```

###throwAsyncStacktrace(extraContext)
Returns a function that will wrap caught response in an error object that contains the asynchronous stacktrace. Will append `extraContext` and throw the wrapped error.
- `extraContext` (optional) String or Object that will be stringified and appended to the error message

```js
return $http
  .get()
  .then()
  .catch(throwAsyncStacktrace({state: 'extra info'}))
```

##Synchronous Stack-Trace
In the case of http requests, the synchronous stacktrace is the stacktrace as the request is response comes in. This is the normal, but less useful, stack-trace included by response errors. Often this trace follows the application function that serviced the request. 

###syncStacktrace
First order function, will wrap caught response in an error object that contains the asynchronous stacktrace and return the wrapped error. Should be passed (not called) as a function into the catch statement.

```js
return $http
  .get()
  .then()
  .catch(syncStacktrace)
```

###throwSyncStacktrace
First order function, will wrap caught response in an error object that contains the asynchronous stacktrace and throw the wrapped error. Should be passed (not called) as a function into the catch statement.

```js
return $http
  .get()
  .then()
  .catch(throwSyncStacktrace)
```

## Middleware
Looking for more useful information about your errors? Wish you had the data from both parts of the error life cycle. Look no further! Middlewares allow you to create higher order functions that will execute in both life cycle contexts.

###addGlobalMiddleware(middlewareFn)
Adds global middleware function that will be called on all autoTrace errors. 

Middlewares must be of the form `asyncErr => syncErr => errToReturn`

###removeAllGlobalMiddlewares()
Deletes all global middleware functions.  

####Middleware Example
Let's say you want to record how long it takes for a request to fail. This requires context surrounding when the error was created and when the error was thrown.

```js
const middleware = asyncErr => {
  const startTime = new Date();
  return syncErr => {
    const errorTime = new Date() - startTime;
    syncErr.message += ' - time to fail: ' + errorTime;
    return syncErr;
  }
}

addGlobalMiddleware(middleware);
```
Resource File
```js
return $http
  .get()
  .then()
  .catch(throwAsyncStacktrace(extraContext))
```
This will create Error: `{message: 'original error message - time to fail: 10s', trace: ...}`

#installation
`npm install auto-trace`
