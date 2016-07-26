'use strict';

var _autoTrace = require('./auto-trace.js');

var autoTrace = _interopRequireWildcard(_autoTrace);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

describe('auto-trace.js', function () {

	describe('withStacktrace', function () {
		it('wraps non-errors in errors', function () {
			expect(autoTrace.withStacktrace('non-error')).toEqual(jasmine.any(Error));
		});
		it('does not re-warp errors', function () {
			var err = new Error('error');
			expect(autoTrace.withStacktrace(err)).toBe(err);
		});
	});

	describe('withoutStacktrace', function () {
		it('returns non-errors untouched', function () {
			var str = 'non-error';
			expect(autoTrace.withoutStacktrace(str)).toBe(str);
		});
		it('returns errors untouched', function () {
			var err = new Error('error');
			expect(autoTrace.withoutStacktrace(err)).toBe(err);
		});
	});

	describe('rejectWithStacktrace', function () {
		it('wraps non-errors in errors and call callback', function () {
			var reject = jasmine.createSpy('reject');
			autoTrace.rejectWithStacktrace(reject)('non-error');
			expect(reject).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('does not wrap errors and calls callback', function () {
			var reject = jasmine.createSpy('reject');
			var err = new Error('error');
			autoTrace.rejectWithStacktrace(reject)(err);
			expect(reject).toHaveBeenCalledWith(err);
		});
	});

	describe('rejectWithoutStacktrace', function () {
		it('leave non-error untouched and call callback', function () {
			var reject = jasmine.createSpy('reject');
			var err = 'non-error';
			autoTrace.rejectWithoutStacktrace(reject)(err);
			expect(reject).toHaveBeenCalledWith(err);
		});
		it('leaves errors untouched and calls callback', function () {
			var reject = jasmine.createSpy('reject');
			var err = new Error('error');
			autoTrace.rejectWithStacktrace(reject)(err);
			expect(reject).toHaveBeenCalledWith(err);
		});
	});

	describe('onErrorWithStacktrace', function () {
		it('wraps non-errors in errors and call callback', function () {
			var onError = jasmine.createSpy('onError');
			autoTrace.onErrorWithStacktrace(onError)('non-error');
			expect(onError).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('does not wrap errors and calls callback', function () {
			var onError = jasmine.createSpy('onError');
			var err = new Error('error');
			autoTrace.onErrorWithStacktrace(onError)(err);
			expect(onError).toHaveBeenCalledWith(err);
		});
	});

	describe('onErrorWithoutStacktrace', function () {
		it('leave non-error untouched and call callback', function () {
			var onError = jasmine.createSpy('onError');
			var err = 'non-error';
			autoTrace.onErrorWithoutStacktrace(onError)(err);
			expect(onError).toHaveBeenCalledWith(err);
		});
		it('leaves errors untouched and calls callback', function () {
			var onError = jasmine.createSpy('onError');
			var err = new Error('error');
			autoTrace.onErrorWithoutStacktrace(onError)(err);
			expect(onError).toHaveBeenCalledWith(err);
		});
	});

	describe('wrapWithStacktrace', function () {
		it('wraps non-errors in errors and calls callback', function () {
			var callback = jasmine.createSpy('callback');
			autoTrace.wrapWithStacktrace(callback)('non-error');
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('does not wrap errors and calls callback', function () {
			var callback = jasmine.createSpy('callback');
			var err = new Error('error');
			autoTrace.wrapWithStacktrace(callback)(err);
			expect(callback).toHaveBeenCalledWith(err);
		});
	});

	describe('wrapWithoutStacktrace', function () {
		it('returns non-errors untouched', function () {
			var str = 'non-error';
			expect(autoTrace.wrapWithoutStacktrace(str)).toBe(str);
		});
		it('returns errors untouched', function () {
			var err = new Error('error');
			expect(autoTrace.wrapWithoutStacktrace(err)).toBe(err);
		});
	});

	describe('throwWithStacktrace', function () {
		it('wraps non-errors in errors and throws', function () {
			expect(function () {
				return autoTrace.throwWithStacktrace('non-error');
			}).toThrow(jasmine.any(Error));
		});
		it('does not re-warp errors and throws', function () {
			var err = new Error('error');
			expect(function () {
				return autoTrace.throwWithStacktrace(err);
			}).toThrow(err);
		});
	});

	describe('throwWithoutStacktrace', function () {
		it('leaves non-errors untouched and throws', function () {
			var err = 'non-error';
			expect(function () {
				return autoTrace.throwWithoutStacktrace(err);
			}).toThrow(err);
		});
		it('leaves errors untouched and throws', function () {
			var err = new Error('error');
			expect(function () {
				return autoTrace.throwWithoutStacktrace(err);
			}).toThrow(err);
		});
	});
});