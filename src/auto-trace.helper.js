/**
 * Wraps err in an Error object (if typeOf rawError != Error)
 *
 * @param {Object} [err]
 * @param {Error}  [asyncErr] - Optional error containing the desired stacktrace
 * @returns {Error} with stacktrace from asyncErr (if provided)
 */
export function wrapObjectWithError(err, asyncErr, extraContext) {
	let errOut;
	if (err && err.autoTraceIgnore){
		//Don't modify stacktrace on errors that have already been handled by auto-trace
		errOut = err;
	}
	else if (err instanceof Error){
		errOut = err;
		if(asyncErr && typeof asyncErr.stack === "string"){
			const asyncFrames = asyncErr.stack.split('\n');
			const syncStacktrace = '\n  at AUTO TRACE SYNC: ' + removeAutoTraceFromErrorStack(err).stack;
			const syncFrames = syncStacktrace.split('\n');
			errOut.stack = asyncFrames.slice(0, 25).join('\n') + syncFrames.slice(0, 25).join('\n');
		}
		errOut.autoTraceIgnore = true;
		errOut = removeAutoTraceFromErrorStack(errOut);
	}
	else {
		errOut = asyncErr || new Error();
		errOut.autoTraceIgnore = true;
		try {
			if (typeof err === "string"){
				errOut.message = err;
			}
			else {
				errOut.originalErrorObject = err;
				errOut.message = JSON.stringify(err);
			}
		}
		catch (ex) {
			console.warn('auto-trace: You are trying to throw something that cannot be stringified', ex);
			errOut.message = err;
		}
		errOut = removeAutoTraceFromErrorStack(errOut);
	}

	return appendExtraContext(errOut, extraContext);
}

/**
 * Appends extraContext to the end of the error description. error will not be modified if no extraContext is provided.
 *
 * @param  {Error} error 			Error to modify
 * @param  {Object} extraContext  	String or Object to stringify and append to the error message
 * @return {Error} 					Error with extraContext
 */
export function appendExtraContext(error, extraContext){
	const errOut = error;

	if (extraContext === null || extraContext === undefined){
		return errOut;
	}
	else if (typeof extraContext === 'string'){
		errOut.message += ` Extra Context: ${extraContext}`;
	}
	else {
		try {
			const message = JSON.stringify(extraContext);
			errOut.message += ` Extra Context: ${message}`;
		}
		catch (ex) {
			console.warn('auto-trace: could not stringify extraContext', ex);
		}
	}

	return errOut
}

/**
 * Removes auto-trace from the error stack
 * @param  {Error} err
 * @return {Error}
 */
export function removeAutoTraceFromErrorStack(err){
	if(err instanceof Error && typeof err.stack === "string"){
		err.stack = err.stack.replace(/\n.*(?:yncStacktrace|wrapObjectWithError) ?\(.*/g,'');
		if (err.message) {
			/* In NodeJS, `throw err` does not print out the err.message, but instead only prints out the
			 * err.stack. Since auto-trace does fancy manipulation of which stack an error has, and what it
			 * looks like, a lot of time error objects for async stacktraces end up not having the error message
			 * inside of the err.stack. This results in `catchAsyncStacktrace()` calls printing unhelpful things
			 * to the console, where it just says `Error` instead of `Error: this is the message`. We correct this
			 * by manually changing the stack to have the error message in it.
			 */
			const lines = err.stack.split('\n');
			if (lines.length > 0 && lines[0] === 'Error') {
				err.stack = err.stack.replace('Error\n', `Error: ${err.message}\n`);
			}
		}
	}
	return err;
}
