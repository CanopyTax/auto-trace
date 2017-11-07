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
			const syncStacktrace = '\n  at AUTO TRACE SYNC: ' + err.stack;
			const syncFrames = syncStacktrace.split('\n');
			//keep first 25 frames of asyncStacktrace, followed by 25 frames of syncStacktrace
			errOut.stack = asyncFrames.slice(0, 25).join('\n') + syncFrames.slice(0, 25).join('\n');
		}
		errOut.autoTraceIgnore = true;
		errOut = addErrorMessageToStack(errOut);
	}
	else {
		errOut = asyncErr || createError(2);
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
		errOut = addErrorMessageToStack(errOut);
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

//This function creates an error and by default removes two frames from the error stack (to remove this method, and the caller, which will be a function inside auto-trace)
//Optionally extraFramesToRemove can be specified to remove more frames if the stack trace will contain more auto-trace refrences.
export function createError(extraFramesToRemove = 1){
	const error = new Error();
	//We remove an extra frame since this function will create a frame as well
	const newStack = error.stack.split('\n');
	if (newStack.length > extraFramesToRemove+1) {
		//Starts on line 1 since the 0th line of the stacktrace is the error message (which we don't want to remove)
		newStack.splice(1, extraFramesToRemove+1);
		error.stack = newStack.join('\n');
	}
	return error;
}

/**
 * Adds error message to the error stack string
 * @param  {Error} err
 * @return {Error}
 */
function addErrorMessageToStack(err){
	if(err instanceof Error && typeof err.stack === "string"){
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
