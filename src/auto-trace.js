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

export function removeAllGlobalMiddlewares(){
	globalMiddlewares = [];
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the async stacktrace
 * Calls globalMiddleware and extraMiddleware functions on rawError before wrapping in Error object
 * In most cases the async stacktrace is most useful - it contains the stacktrace before switching context to caller timeout
 *
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError before being handled
 * @returns {Error} 
 */
export function asyncStacktrace(callback = ()=>{}) {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);

	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		callback(wrapObjectWithError(middlewareErr, asyncStacktraceErr));
	};	
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the async stacktrace
 * Calls globalMiddleware and extraMiddleware functions on rawError before wrapping in Error object 
 * Behaves exactly as asyncStacktrace, but throws the error object instead of returning.
 * In most cases the async stacktrace is most useful - it contains the stacktrace before switching context to caller timeout 
 *
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError before being handled
 * @throws {Error} 
 */
export function throwAsyncStacktrace() {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);
	
	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		throw wrapObjectWithError(middlewareErr, asyncStacktraceErr);
	};
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the default stacktrace
 * Calls globalMiddleware and extraMiddleware functions on rawError before wrapping in Error object
 * sync stacktrace contains the stacktrace afer switching context to caller timeout 
 *
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError before being handled
 * @returns {Error} 
 */
export function syncStacktrace(callback = ()=>{}) {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);
	
	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		callback(wrapObjectWithError(middlewareErr, syncErr));
	};
}

/**
 * Wraps rawError in an Error object (if typeOf rawError != Error) using the default stacktrace
 * Calls globalMiddleware and extraMiddleware functions on rawError before wrapping in Error object 
 * Behaves exactly as syncStacktrace, but throws the error object instead of returning.
 * sync stacktrace contains the stacktrace afer switching context to caller timeout 
 * 
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError before being handled
 * @throws {Error} 
 */
export function throwSyncStacktrace() {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);
	
	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		throw wrapObjectWithError(middlewareErr, syncErr);
	};
}

/**
 * Calls globalMiddleware and extraMiddleware functions on rawError
 * Does not create a stacktrace
 *
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError
 * @returns {Object} 
 */
export function withoutStacktrace(callback = ()=>{}) {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);
	
	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		callback(wrapObjectWithError(middlewareErr));
	};
}

export function throwWithoutStacktrace() {
	const asyncStacktraceErr = new Error();
	const syncMiddlewareErrFunctions = executeAsyncMiddleware(asyncStacktraceErr);
	
	return (rawError) => {
		const syncErr = rawError || new Error()
		const middlewareErr = executeSyncMiddleware(syncMiddlewareErrFunctions, syncErr);
		throw wrapObjectWithError(middlewareErr);
	};
}

/**
 * Calls extraMiddlewares and extraMiddlewares on ogErr
 * 
 * @param   {Object} ogErr
 * @returns  Array of Functions 
 */
function executeAsyncMiddleware(ogErr) {
	return globalMiddlewares
		.map((middleware) => {
			return middleware(ogErr)
		});
}

/**
 * Should this reduce them all? We're mutating the error?
 * @param  {[type]} middlewares [description]
 * @param  {[type]} ogErr       [description]
 * @return {[type]}             [description]
 */
function executeSyncMiddleware(middlewares, ogErr) {
	return middlewares.reduce( (err, middleware) => {
		if(typeof middleware === 'function'){
			return middleware(err); 
		} else {
			throw new Error("the middleware passed to auto-trace did not return a function, see docs for auto-trace middelware https://github.com/CanopyTax/auto-trace/blob/master/README.md");
		}
	}, ogErr);
}