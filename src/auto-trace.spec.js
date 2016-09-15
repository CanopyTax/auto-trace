import * as autoTrace from './auto-trace.js';

describe('auto-trace.js', () => {
	
	let middlewareSpy, middlewareFun, foo;

	beforeEach(() => {
		foo = {
			middlewareSpy: (asyncErr, syncErr) => {
				return syncErr;
			}
		}
		spyOn(foo, 'middlewareSpy').and.callThrough();

		middlewareFun = (asyncErr) => foo.middlewareSpy.bind(null, asyncErr);
		autoTrace.removeAllGlobalMiddlewares();
		autoTrace.addGlobalMiddleware(middlewareFun);
	});

	describe('asyncStacktrace', () => {
		it('should create a new error where none is given then call callback', () => {
			const callback = jasmine.createSpy('callback');
			autoTrace.asyncStacktrace(callback)();
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should wrap non-errors in errors then call callback', () => {
			const callback = jasmine.createSpy('callback');
			autoTrace.asyncStacktrace(callback)('non-error');
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should call callback without wrapping errors', () => {
			const callback = jasmine.createSpy();
			const err = new Error('error');
			autoTrace.asyncStacktrace(callback)(err);
			expect(callback).toHaveBeenCalledWith(err);
		});
		it('should apply globalMiddlewares to error then call callback with error', () => {
			const callbackSpy = jasmine.createSpy();
			const err = new Error('error');
			const expectedAsyncError = new Error('async');
			const expectedSyncError = new Error('sync');
			let outputAsyncError;
			let outputSyncError;
			//Add new middleware
			middlewareFun = asyncErr => {
				outputAsyncError = new Error('async');
				return syncErr => {
					outputSyncError = new Error('sync');
					return syncErr;
				}
			}
			autoTrace.removeAllGlobalMiddlewares();
			autoTrace.addGlobalMiddleware(middlewareFun);

			autoTrace.asyncStacktrace(callbackSpy)(err);
			expect(callbackSpy).toHaveBeenCalledWith(err);
			expect(expectedAsyncError).toEqual(expectedAsyncError);
			expect(expectedSyncError).toEqual(expectedSyncError);
		});
	});

	describe('throwAsyncStacktrace', () => {
		it('should create a new error where none is given then throw', () => {
			expect( () => autoTrace.throwAsyncStacktrace()()).toThrow(jasmine.any(Error));
		});
		it('should wrap non-errors in errors then throw', () => {
			expect( () => autoTrace.throwAsyncStacktrace()('non-error')).toThrow(jasmine.any(Error));
		});
		it('should throw without wrapping errors', () => {
			const err = new Error('error');
			expect( () => autoTrace.throwAsyncStacktrace()(err)).toThrow(jasmine.any(Error));
		});
		it('should call globalMiddleware with async and sync error then throw', () => {
			const err = new Error('error');
			expect(() => autoTrace.throwAsyncStacktrace()(err)).toThrow(jasmine.any(Error));
			expect(foo.middlewareSpy).toHaveBeenCalledWith(jasmine.any(Error), jasmine.any(Error));
		});
		it('should apply globalMiddleware to error then throw', () => {
			const err = new Error('error');
			const expectedAsyncError = new Error('async');
			const expectedSyncError = new Error('sync');
			let outputAsyncError;
			let outputSyncError;
			//Add new middleware
			middlewareFun = asyncErr => {
				outputAsyncError = new Error('async');
				return syncErr => {
					outputSyncError = new Error('sync');
					return syncErr;
				}
			}
			autoTrace.removeAllGlobalMiddlewares();
			autoTrace.addGlobalMiddleware(middlewareFun);

			autoTrace.throwAsyncStacktrace()(err);
			expect(expectedAsyncError).toEqual(expectedAsyncError);
			expect(expectedSyncError).toEqual(expectedSyncError);
		});
		it('should apply multiple globalMiddlewares to error then throw', () => {
			const err = new Error('error');
			
			//Add second middleware
			const middlewareSpy2 = jasmine.createSpy();
			const middlewareFun2 = (asyncErr) => middlewareSpy2.bind(null, asyncErr);
			autoTrace.addGlobalMiddleware(middlewareFun2);

			expect(() => autoTrace.throwAsyncStacktrace()(err)).toThrow(jasmine.any(Error));
			expect(foo.middlewareSpy).toHaveBeenCalledWith(jasmine.any(Error), jasmine.any(Error));
			expect(middlewareSpy2).toHaveBeenCalledWith(jasmine.any(Error), jasmine.any(Error));
		});
	});
	
	describe('syncStacktrace', () => {
		it('should create a new error where none is given', () => {
			expect(autoTrace.syncStacktrace()).toEqual(jasmine.any(Error));
		});
		it('should wraps non-errors in errors', () => {
			const result = autoTrace.syncStacktrace('non-error');
			expect(result).toEqual(jasmine.any(Error));
			expect(result.message).toEqual('non-error');
		});
		it('should not re-warp errors', () => {
			const err = new Error('error');
			expect(autoTrace.syncStacktrace(err)).toBe(err);
		});
		it('should apply a single extraMiddleware to error', () => {
			const err = new Error('error');
			const extraMiddleware = (err) => {err.message = err.message.concat(' 1'); return err;};
			expect(autoTrace.syncStacktrace(err, extraMiddleware).message).toEqual('error 1');
		});
		it('should apply multiple extraMiddlewares to error', () => {
			const err = new Error('error');
			const f1 = (err) => {err.message = err.message.concat(' 1'); return err;};
			const f2 = (err) => {err.message = err.message.concat(' 2'); return err;};
			const f3 = (err) => {err.message = err.message.concat(' 3'); return err;};
			expect(autoTrace.syncStacktrace(err, f1, f2, f3).message).toEqual('error 1 2 3');
		});
	});

	describe('throwSyncStacktrace', () => {
		it('should throw a new error where none is given', () => {
			expect(() => autoTrace.throwSyncStacktrace()).toThrow(jasmine.any(Error));
		});
		it('should wrap non-errors in errors and throw', () => {
			expect( () => autoTrace.throwSyncStacktrace('non-error') ).toThrow(jasmine.any(Error));
		});
		it('should throw without re-wraping errors', () => {
			const err = new Error('error');
			expect( () => autoTrace.throwSyncStacktrace(err) ).toThrow(err);
		});
		it('should apply a single extraMiddleware to error', () => {
			const err = new Error('error');
			const extraMiddleware = (err) => {err.message = err.message.concat(' 1'); return err;};
			expect( () => autoTrace.throwSyncStacktrace(err, extraMiddleware) ).toThrow(jasmine.any(Error));
		});
		it('should apply multiple extraMiddlewares to error', () => {
			const err = new Error('error');
			const f1 = (err) => {err.message = err.message.concat(' 1'); return err;};
			const f2 = (err) => {err.message = err.message.concat(' 2'); return err;};
			const f3 = (err) => {err.message = err.message.concat(' 3'); return err;};
			expect( () => autoTrace.throwSyncStacktrace(err, f1, f2, f3) ).toThrow(jasmine.any(Error));
		});
	});

	describe('withoutStacktrace', () => {
		it('should return undefined when no error is given', () => {
			expect(autoTrace.withoutStacktrace()).toEqual(undefined);
		});
		it('should return non-errors untouched', () => {
			const str = 'non-error';
			expect(autoTrace.withoutStacktrace(str)).toBe(str);
		});
		it('should return errors untouched', () => {
			const err = new Error('error');
			expect(autoTrace.withoutStacktrace(err)).toBe(err);
		});
		it('should apply a single extraMiddleware to error', () => {
			const err = new Error('error');
			const extraMiddleware = (err) => {err.message = err.message.concat(' 1'); return err;};
			expect(autoTrace.withoutStacktrace(err, extraMiddleware).message).toEqual('error 1');
		});
		it('should apply multiple extraMiddlewares to error', () => {
			const err = new Error('error');
			const f1 = (err) => {err.message = err.message.concat(' 1'); return err;};
			const f2 = (err) => {err.message = err.message.concat(' 2'); return err;};
			const f3 = (err) => {err.message = err.message.concat(' 3'); return err;};
			expect(autoTrace.withoutStacktrace(err, f1, f2, f3).message).toEqual('error 1 2 3');
		});
	});


});