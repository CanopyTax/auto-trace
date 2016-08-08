/**
 * Wraps err in an Error object (if typeOf rawError != Error)
 * 
 * @param {Object} [err] 
 * @param {Error}  [stacktraceErr] - Optional error containing the desired stacktrace
 * @returns {Error} with stacktrace from stacktraceErr (if provided)
 */
export function wrapObjectWithError(err, stacktraceErr) {
	if (err instanceof Error){
		const errOut = stacktraceErr || err;
		errOut.message = err.message;
		return errOut;
	} else {
		const result = stacktraceErr || new Error();
		try {
			if (typeof err === "string"){
				result.message = err;
			}
			else {
				result.message = JSON.stringify(err);
			}
		} 
		catch (ex) {
			console.warn('auto-trace: You are trying to throw something that cannot be stringified', ex);
			result.message = err;
		}

		return result;
	}
}