/**
 * Wraps err in an Error object (if typeOf rawError != Error)
 *
 * @param {Object} [err]
 * @param {Error}  [stacktraceErr] - Optional error containing the desired stacktrace
 * @returns {Error} with stacktrace from stacktraceErr (if provided)
 */
export function wrapObjectWithError(err, stacktraceErr, extraContext) {
	let errOut;
	if (err instanceof Error){
		errOut = stacktraceErr || err;
		errOut.message = err.message;
	} 
	else {
		errOut = stacktraceErr || new Error();
		try {
			if (typeof err === "string"){
				errOut.message = err;
			}
			else {
				errOut.message = JSON.stringify(err);
			}
		}
		catch (ex) {
			console.warn('auto-trace: You are trying to throw something that cannot be stringified', ex);
			errOut.message = err;
		}
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