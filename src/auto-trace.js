import { wrapObjectWithError, createError } from './auto-trace.helper.js';
let globalMiddlewares = [];

/**
 * Returns a method that will handle error processing and throwing. Pass this as your onError arg in RxJS subscriptions.
 * This is meant to replace all the other catch and stacktrace methods. https://xkcd.com/927/
 *
 * RxJS Subscription example:
 *   myObs.subscribe(onComplete, catchError())
 *
 * If a callback is passed then that will be called with the processed error instead of throwing the error.
 * e.g.
 *   myObs.subscribe(onComplete, catchError((error, throwError) => {
 *     error.showToast = false
 *     throwError(error)
 *   }))
 */
export function catchError(callback, extraContext) {
  return asyncStacktrace((error) => {
    if (callback) {
      callback(error, function throwError(err) {
        throw err
      })
    } else {
      throw error
    }
  }, extraContext)
}

/**
 * Adds a middleware function that will be called on all errors before being handled by auto-trace
 *
 * @param {function (Object err) => Object newErr } middlewareFn
 */
export function addGlobalMiddleware(middlewareFn) {
	globalMiddlewares.push(middlewareFn)
}

/**
 * Removes all middlewares
 */
export function removeAllGlobalMiddlewares(){
	globalMiddlewares = [];
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the async stacktrace
 * Calls globalMiddleware functions on rawError before wrapping in Error object
 * In most cases the async stacktrace is most useful - it contains the stacktrace before switching context to caller timeout
 *
 * @param {function (Object err) => Object newErr } [callback] - function that will be called with the error
 * @param {Object} rawError
 * @returns {Error}
 */
export function asyncStacktrace(callback = ()=>{}, extraContext) {
	const asyncStacktraceErr = createError();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);

	return (rawError) => {
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, rawError);
		const errOut = wrapObjectWithError(middlewareErr, asyncStacktraceErr, extraContext)
		return callback(errOut);
	};
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the async stacktrace
 * Calls globalMiddleware functions on rawError before wrapping in Error object
 * Behaves exactly as asyncStacktrace, but throws the error object instead of returning.
 * In most cases the async stacktrace is most useful - it contains the stacktrace before switching context to caller timeout
 *
 * @param {function (Object err) => Object newErr } [callback] - function that will be called with the error
 * @param {Object} rawError
 * @returns {Error}
 */
export function catchAsyncStacktrace(extraContext) {
	const asyncStacktraceErr = createError();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);

	return (rawError) => {
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, rawError);
		const errOut = wrapObjectWithError(middlewareErr, asyncStacktraceErr, extraContext);
		setTimeout(() => {throw errOut});
	};
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the default stacktrace
 * Calls globalMiddleware functions on rawError before wrapping in Error object
 * sync stacktrace contains the stacktrace after switching context to caller timeout
 *
 * @param {Object} rawError
 * @returns {Error}
 */
export function syncStacktrace(rawError) {
	const syncStacktraceErr = createError();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(syncStacktraceErr);
	const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, rawError)
	const syncErr = wrapObjectWithError(middlewareErr)
	return syncErr;
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the default stacktrace
 * Calls globalMiddleware functions on rawError before wrapping in Error object
 * Behaves exactly as syncStacktrace, but throws the error object instead of returning.
 * sync stacktrace contains the stacktrace after switching context to caller timeout
 *
 * @param {Object} rawError
 * @throws {Error}
 */
export function catchSyncStacktrace(rawError) {
	const syncStacktraceErr = createError();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(syncStacktraceErr);
	const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, rawError)
	const syncErr = wrapObjectWithError(middlewareErr)
	setTimeout(() => {throw syncErr});
}

/**
 * Calls async middlewares on asyncErr
 *
 * @param   {Object} asyncErr
 * @returns  Array of Functions
 */
function executeAsyncMiddleware(asyncErr) {
	return globalMiddlewares
		.map((middleware) => {
			return middleware(asyncErr)
		});
}

/**
 * Calls Sync middlewares on ogErr
 * @param  {array of functions} middlewares - the middlewares to call on ogErr
 * @param  {Error} ogErr - original gansta error
 * @return {Error} the new error, after it has been passed through the middlewares
 */
function executeSyncMiddleware(middlewares, ogErr) {
	//Don't run middlewares on errors that have already been handled by auto-trace
	if (ogErr && ogErr.autoTraceIgnore){
		return ogErr
	}
	return middlewares.reduce( (syncErr, middleware) => {
		if(typeof middleware === 'function'){
			return middleware(syncErr);
		} else {
			throw new Error("the middleware passed to auto-trace did not return a function, see docs for auto-trace middleware https://github.com/CanopyTax/auto-trace/blob/master/README.md");
		}
	}, ogErr);
}
