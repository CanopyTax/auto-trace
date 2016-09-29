import { wrapObjectWithError, appendExtraContext, removeAutoTraceFromErrorStack } from './auto-trace.helper.js';

describe('auto-trace.js', () => {

	describe('wrapObjectWithError', () => {
		it('should create a new error where none is given', () => {
			const err = wrapObjectWithError();

			//should wrap with error
			expect(err).toEqual(jasmine.any(Error));
			
			//should set autoTraceIgnore to true
			expect(err.autoTraceIgnore).toEqual(true);

			//Should not contain wrapObjectWithError in stack trace	
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
		it('should wraps non-errors in errors', () => {
			const err = wrapObjectWithError('non-error');
			expect(err).toEqual(jasmine.any(Error));
			expect(err.message).toEqual('non-error');
			expect(err.autoTraceIgnore).toEqual(true);
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
		it('should not re-warp errors', () => {
			const err = new Error('error');
			const result = wrapObjectWithError(err);
			expect(result).toBe(err);
			expect(result.autoTraceIgnore).toEqual(true);
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
		it('should ignore errors already handled by autoTrace', () => {
			const err = wrapObjectWithError({message: 'non-error', autoTraceIgnore: true});
			expect(err).toEqual({message: 'non-error', autoTraceIgnore: true});
		});
		it('should continue to add extra context to errors already handled by autoTrace', () => {
			const err = new Error('error');
			const result = wrapObjectWithError(wrapObjectWithError(err, null, 'More 1'), null, 'More 2');
			expect(result).toEqual(Error('error Extra Context: More 1 Extra Context: More 2'));
		});
		it('should return error with message from first param and stacktrace of second param', () => {
			const err = new Error('original error message');
			const stacktraceErr = new Error('Stacktrace error message');
			const result = wrapObjectWithError(err, stacktraceErr);
			expect(result).toEqual(jasmine.any(Error));
			expect(result.message).toEqual('original error message');
			expect(result.stack).toEqual(stacktraceErr.stack);
			expect(result.stack).not.toEqual(err.stack);
			expect(result.autoTraceIgnore).toEqual(true);
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
	});

	describe('appendExtraContext', () => {
		it('should return the error untouched if no extraContext is provided', () => {
			const err = new Error("Something went wrong!")
			expect(appendExtraContext(err)).toBe(err);
		});
		it('should append extraContext to error message', () => {
			const err = new Error("Something went wrong!")
			const extraContext = `Here's more info`;
			expect(appendExtraContext(err, extraContext)).toEqual(Error(`Something went wrong! Extra Context: Here's more info`));
		});
		it('should append extraContext to error message', () => {
			const err = new Error("Something went wrong!")
			const extraContext = {userid: 23, moreInfo:'junk'};
			expect(appendExtraContext(err, extraContext)).toEqual(Error(`Something went wrong! Extra Context: {"userid":23,"moreInfo":"junk"}`));
		});
	});

	describe('removeAutoTraceFromErrorStack', () => {
		it('should replace instances of AsyncStacktrace', () => {
			const err = new Error('err');
			err.stack = `Error
    at AsyncStacktrace (src/auto-trace.helper.js:21:29)
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
    		const expectedStack = `Error
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
			expect(removeAutoTraceFromErrorStack(err).stack).toEqual(expectedStack);
		});
		it('should replace instances of wrapObjectWithError and AsyncStacktrace', () => {
			const err = new Error('err');
			err.stack = `Error
    at wrapObjectWithError (src/auto-trace.helper.js:21:29)
    at AsyncStacktrace (src/auto-trace.helper.js:21:29)
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
    		const expectedStack = `Error
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
			expect(removeAutoTraceFromErrorStack(err).stack).toEqual(expectedStack);
		});
		it('should replace leave non-AutoTrace error stacks untouched', () => {
			const err = new Error('err');
			err.stack = `Error
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
    		const expectedStack = `Error
    at Object.<anonymous> (src/auto-trace.helper.spec.js:12:16)
    at attemptSync (/Users/keith/dev/auto-trace/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1886:24)`;
			expect(removeAutoTraceFromErrorStack(err).stack).toEqual(expectedStack);
		});
	});

});