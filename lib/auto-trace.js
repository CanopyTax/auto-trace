'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.addMiddleware = addMiddleware;
exports.withStacktrace = withStacktrace;
exports.withoutStacktrace = withoutStacktrace;
exports.rejectWithStacktrace = rejectWithStacktrace;
exports.rejectWithoutStacktrace = rejectWithoutStacktrace;
exports.onErrorWithStacktrace = onErrorWithStacktrace;
exports.onErrorWithoutStacktrace = onErrorWithoutStacktrace;
exports.wrapWithStacktrace = wrapWithStacktrace;
exports.wrapWithoutStacktrace = wrapWithoutStacktrace;
exports.throwWithStacktrace = throwWithStacktrace;
exports.throwWithoutStacktrace = throwWithoutStacktrace;
exports.wrapThrowWithStacktrace = wrapThrowWithStacktrace;
var globalMiddlewares = [];

function addMiddleware(middlewareFn) {
	globalMiddlewares.push(middlewareFn);
}

function withStacktrace(err) {
	return wrapObjectWithError(err);
}

function withoutStacktrace(err) {
	return err;
}

function rejectWithStacktrace(reject) {
	return wrapWithStacktrace.apply(this, arguments);
}

function rejectWithoutStacktrace(reject) {
	return function (err) {
		reject(err);
	};
}

function onErrorWithStacktrace(onError) {
	return wrapWithStacktrace.apply(this, arguments);
}

function onErrorWithoutStacktrace(onError) {
	return function (err) {
		onError(err);
	};
}

function wrapWithStacktrace(callback) {
	for (var _len = arguments.length, extraMiddlewares = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		extraMiddlewares[_key - 1] = arguments[_key];
	}

	var stacktraceErr = new Error();
	return function (rawError) {
		var middlewareErr = executeMiddleware(rawError, extraMiddlewares);
		callback(wrapObjectWithError(middlewareErr, stacktraceErr));
	};
}

function wrapWithoutStacktrace(err) {
	return err;
}

function throwWithStacktrace(err) {
	throw withStacktrace(err);
}

function throwWithoutStacktrace(err) {
	throw err;
}

function wrapThrowWithStacktrace(err) {
	for (var _len2 = arguments.length, extraMiddlewares = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
		extraMiddlewares[_key2 - 1] = arguments[_key2];
	}

	var stacktraceErr = new Error();
	return function (rawError) {
		var middlewareErr = executeMiddleware(rawError, extraMiddlewares);
		throw wrapObjectWithError(middlewareErr, stacktraceErr);
	};
}

function wrapObjectWithError(err, stacktraceErr) {
	if (err instanceof Error) {
		return err;
	} else {
		var result = stacktraceErr || new Error();
		try {
			result.message = JSON.stringify(err);
		} catch (ex) {
			console.warn('auto-trace: You are trying to throw something that cannot be stringified', ex);
			result.message = err;
		}

		return result;
	}
}

function executeMiddleware(ogErr, extraMiddlewares) {
	return globalMiddlewares.concat(extraMiddlewares).reduce(function (err, middleware) {
		return middleware(err);
	}, ogErr);
}