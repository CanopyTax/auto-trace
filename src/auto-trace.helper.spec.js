import { wrapObjectWithError, appendExtraContext, createError } from './auto-trace.helper.js';

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
		it('should wrap non-errors in errors', () => {
			const err = wrapObjectWithError('non-error');
			expect(err).toEqual(jasmine.any(Error));
			expect(err.message).toEqual('non-error');
			expect(err.autoTraceIgnore).toEqual(true);
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
		it('should wrap non-errors objects in errors', () => {
			const err = wrapObjectWithError({test: 'testing'});
			expect(err).toEqual(jasmine.any(Error));
			expect(err.message).toEqual(JSON.stringify({test: 'testing'}));
			expect(err.originalErrorObject).toEqual({test: 'testing'});
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
			const asyncErr = new Error('Stacktrace error message');
			err.stack = `Error:
	at _showMoreLicensesDialog(/4.global-settings.js:428:111)
	at HTMLUnknownElement.d(/static/raven/raven-3.9.1-d.min.js:2:6222)`
			asyncErr.stack = `Error:
	at _showMoreLicensesDialog(/4.global-settings.js:428:111)
	at HTMLUnknownElement.d(/static/raven/raven-3.9.1-d.min.js:2:6222)`
			const result = wrapObjectWithError(err, asyncErr);
			expect(result).toEqual(jasmine.any(Error));
			expect(result.message).toEqual('original error message');

			// It should have the stacktraces from both the err and the asyncErr
			expect(result.stack.indexOf(asyncErr.stack)).toBeGreaterThan(-1);
			expect(result.stack.indexOf(err.stack)).toBeGreaterThan(-1);

			expect(result.autoTraceIgnore).toEqual(true);
			expect(err.stack.indexOf('wrapObjectWithError')).toEqual(-1);
		});
		it('should store sync and async stack traces', () => {
			const err = new Error('My sync error message will be preserved');
			err.stack = `Error: My sync error message will be preserved
	at _showMoreLicensesDialog(/4.global-settings.js:428:111)
	at HTMLUnknownElement.d(/static/raven/raven-3.9.1-d.min.js:2:6222)
	at Array.forEach(<anonymous>)`;
			const asyncErr = new Error('My async error message will live on in the stack');
			asyncErr.stack = `Error: My async error message will live on in the stack
	at SigningModal._this.createOrGetSigningExperience(./src/signing-modal.component.js:110:4)
	at createOrGetSigningExperience(./src/signing-modal.component.js:77:7)
	at closeAll(../jspm_packages/npm/react-dom@15.5.4/lib/Transaction.js:153:15)`
			const result = wrapObjectWithError(err, asyncErr);
			const expectedStackTrace = `Error: My async error message will live on in the stack
	at SigningModal._this.createOrGetSigningExperience(./src/signing-modal.component.js:110:4)
	at createOrGetSigningExperience(./src/signing-modal.component.js:77:7)
	at closeAll(../jspm_packages/npm/react-dom@15.5.4/lib/Transaction.js:153:15)
  at AUTO TRACE SYNC: Error: My sync error message will be preserved
	at _showMoreLicensesDialog(/4.global-settings.js:428:111)
	at HTMLUnknownElement.d(/static/raven/raven-3.9.1-d.min.js:2:6222)
	at Array.forEach(<anonymous>)`;
			expect(result.stack).toEqual(expectedStackTrace);
			expect(result.message).toEqual(`My sync error message will be preserved`);
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
	describe('createError', () => {
		it('should create and error and remove 2 lines from stack', () => {
			const err = createError();
			expect(err.stack.split('\n').length).toEqual(9);
		});	
		it('should create and error and remove 4 lines from stack', () => {
			const err = createError(3);
			expect(err.stack.split('\n').length).toEqual(7);
		});	
		it('should not remove any frames if the frames to remove count is larger than the total number of frames', () => {
			const err = createError(100);
			expect(err.stack.split('\n').length).toEqual(11);
		});	
	});
});
