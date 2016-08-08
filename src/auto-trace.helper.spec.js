import { wrapObjectWithError } from './auto-trace.helper.js';

describe('auto-trace.js', () => {

	describe('wrapObjectWithError', () => {
		it('should create a new error where none is given', () => {
			expect(wrapObjectWithError()).toEqual(jasmine.any(Error));
		});
		it('should wraps non-errors in errors', () => {
			const err = wrapObjectWithError('non-error');
			expect(err).toEqual(jasmine.any(Error));
			expect(err.message).toEqual('non-error');
		});
		it('should not re-warp errors', () => {
			const err = new Error('error');
			expect(wrapObjectWithError(err)).toBe(err);
		});
		it('should return error with message from first param and stacktrace of second param', () => {
			const err = new Error('original error message');
			const stacktraceErr = new Error('Stacktrace error message');
			const result = wrapObjectWithError(err, stacktraceErr);
			expect(result).toEqual(jasmine.any(Error));
			expect(result.message).toEqual('original error message');
			expect(result.stack).toEqual(stacktraceErr.stack);
			expect(result.stack).not.toEqual(err.stack);

		});
	});

});