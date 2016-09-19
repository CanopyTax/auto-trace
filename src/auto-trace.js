import { wrapObjectWithError } from './auto-trace.helper.js';
let globalMiddlewares = [];

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
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);

	return (rawError) => {
		const err = wrapObjectWithError(rawError, asyncStacktraceErr, extraContext)
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, err);
		callback(middlewareErr);
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
export function throwAsyncStacktrace(extraContext) {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);

	return (rawError) => {
		const err = wrapObjectWithError(rawError, asyncStacktraceErr, extraContext)
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, err);
		setTimeout(() => {throw middlewareErr});
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
	const syncErr = wrapObjectWithError(rawError)
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(syncErr);
	const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr)
	return middlewareErr;
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
export function throwSyncStacktrace(rawError) {
	const syncErr = wrapObjectWithError(rawError);
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(syncErr);
	const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr)
	setTimeout(() => {throw middlewareErr});
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
	return middlewares.reduce( (syncErr, middleware) => {
		if(typeof middleware === 'function'){
			return middleware(syncErr);
		} else {
			throw new Error("the middleware passed to auto-trace did not return a function, see docs for auto-trace middleware https://github.com/CanopyTax/auto-trace/blob/master/README.md");
		}
	}, ogErr);
}