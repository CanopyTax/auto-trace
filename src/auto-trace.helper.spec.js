import { wrapObjectWithError, appendExtraContext } from './auto-trace.helper.js';

describe('auto-trace.js', () => {

	describe('wrapObjectWithError', () => {
		it('should create a new error where none is given', () => {
			const err = wrapObjectWithError();
			expect(err).toEqual(jasmine.any(Error));
			expect(err.autoTraceIgnore).toEqual(true);
		});
		it('should wraps non-errors in errors', () => {
			const err = wrapObjectWithError('non-error');
			expect(err).toEqual(jasmine.any(Error));
			expect(err.message).toEqual('non-error');
			expect(err.autoTraceIgnore).toEqual(true);
		});
		it('should not re-warp errors', () => {
			const err = new Error('error');
			const result = wrapObjectWithError(err);
			expect(result).toBe(err);
			expect(result.autoTraceIgnore).toEqual(true);
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

});