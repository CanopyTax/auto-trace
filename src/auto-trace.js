const globalMiddlewares = [];

/**
 * Adds a middleware function that will be called on all errors before being handled by auto-trace
 *
 * @param {function (Object err) => Object newErr } middlewareFn 
 */
export function addGlobalMiddleware(middlewareFn) {
	globalMiddlewares.push(middlewareFn)
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
export function asyncStacktrace(callback = ()=>{}, ...extraMiddlewares) {
	const stacktraceErr = new Error();

	return (rawError) => {
		const err = rawError || new Error()
		const middlewareErr = executeMiddleware(err, extraMiddlewares);
		callback(wrapObjectWithError(middlewareErr, stacktraceErr));
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
export function throwAsyncStacktrace(...extraMiddlewares) {
	const stacktraceErr = new Error();

	return (rawError) => {
		const err = rawError || new Error()
		const middlewareErr = executeMiddleware(err, extraMiddlewares);
		throw wrapObjectWithError(middlewareErr, stacktraceErr);
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
export function syncStacktrace(rawError, ...extraMiddlewares){
	const err = rawError || new Error();
	const middlewareErr = executeMiddleware(err, extraMiddlewares);
	return wrapObjectWithError(middlewareErr);
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
export function throwSyncStacktrace(rawError, ...extraMiddlewares){
	throw syncStacktrace(rawError, ...extraMiddlewares);
}

/**
 * Calls globalMiddleware and extraMiddleware functions on rawError
 * Does not create a stacktrace nor will it wrap rawError in Error object
 *
 * @param {Object}   [rawError] 
 * @param {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on rawError
 * @returns {Object} 
 */
export function withoutStacktrace(rawError, ...extraMiddlewares){
	const middlewareErr = executeMiddleware(rawError, extraMiddlewares);
	return middlewareErr;
}


/**
 * Wraps err in an Error object (if typeOf rawError != Error)
 * 
 * @param {Object} [err] 
 * @param {Error}  [stacktraceErr] - Optional error containing the desired stacktrace
 * @returns {Error} with stacktrace from stacktraceErr (if provided)
 */
function wrapObjectWithError(err, stacktraceErr) {
	if (err instanceof Error){
		return err;
	} else {
		const result = stacktraceErr || new Error();
		try {
			result.message = JSON.stringify(err);
		} 
		catch (ex) {
			console.warn('auto-trace: You are trying to throw something that cannot be stringified', ex);
			result.message = err;
		}

		return result;
	}
}

/**
 * Calls extraMiddlewares and extraMiddlewares on ogErr
 * 
 * @param   {Object} ogErr
 * @param   {function (Object err) => Object newErr } [extraMiddlewares] - middleware function(s) that will be called on ogErr
 * @returns {Object} 
 */
function executeMiddleware(ogErr, extraMiddlewares) {
	return globalMiddlewares
		.concat(extraMiddlewares)
		.reduce((err, middleware) => {
			return middleware(err)
		}, ogErr);
}