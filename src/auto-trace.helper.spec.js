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
		it('should work with node stacktrace', () => {
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
		it('should work with chrome stacktrace', () => {
			const err = new Error('err');
			err.stack = `Error: {"code":0,"message":"An unknown error occurred","status":500}
  at asyncStacktrace(~/auto-trace/lib/auto-trace.js:46:27)
  at a(./angular/app/admin/sources/sources-settings.component.js:112:28)
  at fn(eval at compile (https://cdn.canopytax.com/sofe/workflow-ui/v5.1.0-1491-g6f60869/workflow-ui.js), <anonymous>:4:410)
  at g(~/angular/angular.min.js:126:127)
  at this(~/angular/angular.min.js:276:194)
  at $eval(~/angular/angular.min.js:145:347)
  at $apply(~/angular/angular.min.js:146:51)
  at apply(~/angular/angular.min.js:276:246)
  at apply(../jspm_packages/npm/jquery@2.2.4/dist/jquery.js:4736:5)
  at apply(../jspm_packages/npm/jquery@2.2.4/dist/jquery.js:4548:4)
  at apply(raven.js:379:28)`;
    		const expectedStack = `Error: {"code":0,"message":"An unknown error occurred","status":500}
  at a(./angular/app/admin/sources/sources-settings.component.js:112:28)
  at fn(eval at compile (https://cdn.canopytax.com/sofe/workflow-ui/v5.1.0-1491-g6f60869/workflow-ui.js), <anonymous>:4:410)
  at g(~/angular/angular.min.js:126:127)
  at this(~/angular/angular.min.js:276:194)
  at $eval(~/angular/angular.min.js:145:347)
  at $apply(~/angular/angular.min.js:146:51)
  at apply(~/angular/angular.min.js:276:246)
  at apply(../jspm_packages/npm/jquery@2.2.4/dist/jquery.js:4736:5)
  at apply(../jspm_packages/npm/jquery@2.2.4/dist/jquery.js:4548:4)
  at apply(raven.js:379:28)`;
			expect(removeAutoTraceFromErrorStack(err).stack).toEqual(expectedStack);
		});
		it('should work with firefox stacktrace', () => {
			//firefox stacktrace docs -  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
			const err = new Error('err');
			err.stack = `Error: message
  at asyncStacktrace(../jspm_packages/npm/auto-trace@2.2.0/lib/auto-trace.js:46:2)
  at updateAnswer/<(../src/source-forms/answers/answer.actions.js:60:4)
  at createThunkMiddleware/</</<(../jspm_packages/npm/redux-thunk@2.1.0/lib/index.js:11:10)
  at func(../jspm_packages/npm/redux@3.5.2/lib/bindActionCreators.js:7:4)
  at apply(../jspm_packages/npm/lodash@4.13.1/lodash.js:413:4)
  at f(../jspm_packages/npm/lodash@4.13.1/lodash.js:4836:8)
  at fancyUpdateAnswer(../src/source-forms/questions/question.component.js:77:3)
  at func(../src/source-forms/inputs/currency.component.js:75:3)
  at ReactErrorUtils(../jspm_packages/npm/react@15.2.1/lib/ReactErrorUtils.js:26:11)
  at executeDispatch(../jspm_packages/npm/react@15.2.1/lib/EventPluginUtils.js:89:4)
  at EventPluginUtils(../jspm_packages/npm/react@15.2.1/lib/EventPluginUtils.js:112:4)
  at executeDispatchesAndRelease(../jspm_packages/npm/react@15.2.1/lib/EventPluginHub.js:44:4)`;
    		const expectedStack = `Error: message
  at updateAnswer/<(../src/source-forms/answers/answer.actions.js:60:4)
  at createThunkMiddleware/</</<(../jspm_packages/npm/redux-thunk@2.1.0/lib/index.js:11:10)
  at func(../jspm_packages/npm/redux@3.5.2/lib/bindActionCreators.js:7:4)
  at apply(../jspm_packages/npm/lodash@4.13.1/lodash.js:413:4)
  at f(../jspm_packages/npm/lodash@4.13.1/lodash.js:4836:8)
  at fancyUpdateAnswer(../src/source-forms/questions/question.component.js:77:3)
  at func(../src/source-forms/inputs/currency.component.js:75:3)
  at ReactErrorUtils(../jspm_packages/npm/react@15.2.1/lib/ReactErrorUtils.js:26:11)
  at executeDispatch(../jspm_packages/npm/react@15.2.1/lib/EventPluginUtils.js:89:4)
  at EventPluginUtils(../jspm_packages/npm/react@15.2.1/lib/EventPluginUtils.js:112:4)
  at executeDispatchesAndRelease(../jspm_packages/npm/react@15.2.1/lib/EventPluginHub.js:44:4)`;
			expect(removeAutoTraceFromErrorStack(err).stack).toEqual(expectedStack);
		});
		it('should work with IE / Edge stacktrace', () => {
			//IE and Edge docs - https://msdn.microsoft.com/en-us/library/windows/apps/hh699850.aspx
			const err = new Error('err');
			err.stack = `Error: message
  at asyncStacktrace (../jspm_packages/npm/auto-trace@2.2.0/lib/auto-trace.js:46:2)
  at updateAnswer (../src/source-forms/answers/answer.actions.js:60:4)
  at createThunkMiddleware (../jspm_packages/npm/redux-thunk@2.1.0/lib/index.js:11:10)
  at func (../jspm_packages/npm/redux@3.5.2/lib/bindActionCreators.js:7:4)
  at apply (../jspm_packages/npm/lodash@4.13.1/lodash.js:413:4)
  at f (../jspm_packages/npm/lodash@4.13.1/lodash.js:4836:8)
  at fancyUpdateAnswer (../src/source-forms/questions/question.component.js:77:3)`;
    		const expectedStack = `Error: message
  at updateAnswer (../src/source-forms/answers/answer.actions.js:60:4)
  at createThunkMiddleware (../jspm_packages/npm/redux-thunk@2.1.0/lib/index.js:11:10)
  at func (../jspm_packages/npm/redux@3.5.2/lib/bindActionCreators.js:7:4)
  at apply (../jspm_packages/npm/lodash@4.13.1/lodash.js:413:4)
  at f (../jspm_packages/npm/lodash@4.13.1/lodash.js:4836:8)
  at fancyUpdateAnswer (../src/source-forms/questions/question.component.js:77:3)`;
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