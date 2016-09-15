# auto-trace
A library that fixes all your stack trace problems.

This library helps transfrom garbage errors into beatiful objects filled with insight and understanding. This is especailly useful for apps that use an error reporting service such as bugsnag or sentry. 

- Provide a meaningful Stack Trace (for optimum error blameage)
- Prevent iresponsible throwing of Non-Error objects
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

## Error Lifecycle 
There are two parts to the error lifecycle
- Error Created `new Error()`
- Error Thrown `throw err`

These events do not always occur at the same time. $http is an example of this. Since $http makes an async request, an error stacktrace will contain the call stack of the invoker as the request comes in (this is the syncStacktrace). Often the more usefull stacktrace is the call stack as the request went out `Controller->Service->Resource` (this is the asyncStacktrace). 

# Middleware
Looking for more useful information about your errors? Wish you had the data from both parts of the error lifecycle. Look no further! Middlewares allow you to create higher order functions that will execute in both lifecycle contexts.

Let's say you want to record how long it takes for a request to fail. This requires context surrounding when the error was created and when the error was thrown.

```js
func middleware = asyncErr => {
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


```js
addGlobalMiddleware(fn);
```

##installation 
`npm install auto-trace`
