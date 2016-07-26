import * as autoTrace from './auto-trace.js';

describe('auto-trace.js', () => {

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
		it('should call callback withou wrapping errors', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			autoTrace.asyncStacktrace(callback)(err);
			expect(callback).toHaveBeenCalledWith(err);
		});
		it('should apply a single extraMiddleware to error and call callback', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			const extraMiddleware = (err) => {err.message = err.message.concat(' 1'); return err;};
			autoTrace.asyncStacktrace(callback, extraMiddleware)(err);
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should apply multiple extraMiddlewares to error', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			const f1 = (err) => {err.message = err.message.concat(' 1'); return err;};
			const f2 = (err) => {err.message = err.message.concat(' 2'); return err;};
			const f3 = (err) => {err.message = err.message.concat(' 3'); return err;};
			autoTrace.asyncStacktrace(callback, f1, f2, f3)(err);
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
	});

	describe('throwAsyncStacktrace', () => {
		it('should create a new error where none is given then throw', () => {
			const callback = jasmine.createSpy('callback');
			expect( () => autoTrace.throwAsyncStacktrace(callback)()).toThrow(jasmine.any(Error));
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should wrap non-errors in errors then throw', () => {
			const callback = jasmine.createSpy('callback');
			expect( () => autoTrace.throwAsyncStacktrace(callback)('non-error')).toThrow(jasmine.any(Error));
			expect(callback).toHaveBeenCalledWith('non-error');
		});
		it('should throw without wrapping errors', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			expect( () => autoTrace.throwAsyncStacktrace(callback)(err)).toThrow(jasmine.any(Error));
			expect(callback).toHaveBeenCalledWith(err);
		});
		it('should apply a single extraMiddleware to error and throw', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			const extraMiddleware = (err) => {err.message = err.message.concat(' 1'); return err;};
			expect( () => autoTrace.throwAsyncStacktrace(callback, extraMiddleware)(err)).toThrow(jasmine.any(Error));
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should apply multiple extraMiddlewares to error then throw', () => {
			const callback = jasmine.createSpy('callback');
			const err = new Error('error');
			const f1 = (err) => {err.message = err.message.concat(' 1'); return err;};
			const f2 = (err) => {err.message = err.message.concat(' 2'); return err;};
			const f3 = (err) => {err.message = err.message.concat(' 3'); return err;};
			expect( () => autoTrace.throwAsyncStacktrace(callback, f1, f2, f3)(err)).toThrow(jasmine.any(Error));
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
	});
	
	describe('syncStacktrace', () => {
		it('should create a new error where none is given', () => {
			expect(autoTrace.syncStacktrace()).toEqual(jasmine.any(Error));
		});
		it('should wraps non-errors in errors', () => {
			expect(autoTrace.syncStacktrace('non-error')).toEqual(jasmine.any(Error));
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
		it('should throw withou re-warping errors', () => {
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
		it('should create a new error where none is given', () => {
			expect(autoTrace.withoutStacktrace()).toEqual(jasmine.any(Error));
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