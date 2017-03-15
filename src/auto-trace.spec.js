import * as autoTrace from './auto-trace.js';

describe('auto-trace.js', () => {

	let foo, errorCatcher, callAsync, callSync, middlewareFun;

	beforeEach(() => {
		callAsync = callSync = false;
		foo = asyncErr => {
				callAsync = true;
				return syncErr => {
					callSync = true;
					return syncErr;
				}
			}

		autoTrace.removeAllGlobalMiddlewares();
		autoTrace.addGlobalMiddleware(foo);

		errorCatcher = () => {fail('errorCatcher was called by test but not overwritten')};
	});

	afterEach(() => {
		process.removeListener('uncaughtException', errorCatcher);
	})

	describe('asyncStacktrace', () => {
		it('should create a new error where none is given then call callback', () => {
			const callback = jasmine.createSpy('callback');
			autoTrace.asyncStacktrace(callback)();
			expect(callback).toHaveBeenCalledWith(jasmine.any(Error));
		});
		it('should wrap non-errors in errors then call callback', () => {
			const callback = jasmine.createSpy('callback');
			autoTrace.asyncStacktrace(callback)('non-error');
			expect(callback).toHaveBeenCalledWith(Error('non-error'));
		});
		it('should call callback without wrapping errors', () => {
			const callback = jasmine.createSpy();
			const err = new Error('error');
			autoTrace.asyncStacktrace(callback)(err);
			expect(callback).toHaveBeenCalledWith(err);
		});
		it('should wrap non-errors in errors and attach extraContext', () => {
			const callback = jasmine.createSpy('callback');
			const extraContext = {info: 'Lookout', user: {id:32, name:'Oli'}};
			autoTrace.asyncStacktrace(callback, extraContext)('non-error');
			expect(callback).toHaveBeenCalledWith(Error(`non-error Extra Context: {"info":"Lookout","user":{"id":32,"name":"Oli"}}`));
		});
		it('should call middlewares with async and sync errs', () => {
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

		it('should not call sync middlewares when autoTraceIgnore is set', () => {
			const callbackSpy = jasmine.createSpy();
			const err = new Error('error');
			err.autoTraceIgnore = true;

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
			expect(outputAsyncError).toEqual(Error('async')); //Can't avoid calling this
			expect(outputSyncError).toEqual(undefined);

		});
		it('should apply multiple middlewares and modify the error accordingly', () => {
			const callbackSpy = jasmine.createSpy();
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc1 = asyncErr => {
				const msg1 = '1a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 1b`
					return outputSyncError;
				}
			}
			const middlewareFunc2 = asyncErr => {
				const msg1 = '2a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2b`
					return outputSyncError;
				}
			}
			const middlewareFunc3 = asyncErr => {
				const msg1 = '3a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 3b`
					return outputSyncError;
				}
			}
			autoTrace.addGlobalMiddleware(middlewareFunc1);
			autoTrace.addGlobalMiddleware(middlewareFunc2);
			autoTrace.addGlobalMiddleware(middlewareFunc3);

			autoTrace.asyncStacktrace(callbackSpy)(err);

			expect(callbackSpy).toHaveBeenCalledWith(Error('error 1a 1b 2a 2b 3a 3b'));
		});
		it('should propagate properties from original error to after wrapped error', () => {
			var errCallback = autoTrace.asyncStacktrace(errorThatWouldBeThrown => {
				expect(errorThatWouldBeThrown.customProperty).toBe(true);

			});
			var customError = new Error('Custom message');
			customError.customProperty = true;
			errCallback(customError);
		});
		it('should return the value returned by the callback', () => {
			var expectedResult;
			var errCallback = autoTrace.asyncStacktrace(err => {
				expectedResult = err;
				return err;
			});
			var customError = new Error('Custom message');
			customError.customProperty = true;
			const actualResult = errCallback(customError);
			expect(actualResult).toBe(expectedResult);
		});
	});

	describe('catchAsyncStacktrace', () => {
		it('should create a new error where none is given then throw', (done) => {

			errorCatcher = (ex) => {
				expect(ex).toEqual(jasmine.any(Error));
				expect(ex.stack.indexOf('catchAsyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()();
		});
		it('should wrap non-errors in errors then throw', (done) => {

			errorCatcher = (ex) => {
				expect(ex).toEqual(Error('non-error'));
				expect(ex.stack.indexOf('catchAsyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()('non-error');
		});
		it('should throw without wrapping errors', (done) => {
			const err = new Error('error');

			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				expect(ex.stack.indexOf('catchAsyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()(err)
		});
		it('should wrap non-errors in errors and attach extraContext', (done) => {
			const extraContext = {info: 'Lookout', user: {id:32, name:'Oli'}};

			errorCatcher = (ex) => {
				expect(ex).toEqual(Error(`non-error Extra Context: {"info":"Lookout","user":{"id":32,"name":"Oli"}}`));
				expect(ex.stack.indexOf('catchAsyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace(extraContext)('non-error');
		});
		it('should call middleware with async and sync error then throw', (done) => {
			const err = new Error('error');
			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				expect(callSync).toBe(true);
				expect(callAsync).toBe(true);
				expect(ex.stack.indexOf('catchAsyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()(err);
		});
		it('should execute middlewares for both async and sync errors', (done) => {
			const err = new Error('error');
			const expectedAsyncError = new Error('async');
			const expectedSyncError = new Error('sync');
			let outputAsyncError;
			let outputSyncError;
			//Add new middleware
			const middlewareFunc = asyncErr => {
				outputAsyncError = new Error('async');
				return syncErr => {
					outputSyncError = new Error('sync');
					return syncErr;
				}
			}
			autoTrace.removeAllGlobalMiddlewares();
			autoTrace.addGlobalMiddleware(middlewareFunc);

			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				expect(expectedAsyncError).toEqual(expectedAsyncError);
				expect(expectedSyncError).toEqual(expectedSyncError);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()(err);
		});
		it('should apply multiple middlewares to error then throw', (done) => {
			const err = new Error('error');
			let callAsync2 = false, callSync2 = false;

			//Add second middleware
			const foo2 = asyncErr => {
					callAsync2 = true;
					return syncErr => {
						callSync2 = true;
						return syncErr;
					}
				}

			autoTrace.addGlobalMiddleware(foo2);

			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				expect(callSync2).toBe(true);
				expect(callAsync2).toBe(true);
				done();
			};
			process.on('uncaughtException', errorCatcher);


			autoTrace.catchAsyncStacktrace()(err);
		});
		it('should apply multiple middlewares and modify the error accordingly', (done) => {
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc1 = asyncErr => {
				const msg1 = '1a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 1b`
					return outputSyncError;
				}
			}
			const middlewareFunc2 = asyncErr => {
				const msg1 = '2a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2b`
					return outputSyncError;
				}
			}
			const middlewareFunc3 = asyncErr => {
				const msg1 = '3a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 3b`
					return outputSyncError;
				}
			}

			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				autoTrace.addGlobalMiddleware(middlewareFunc1);
				autoTrace.addGlobalMiddleware(middlewareFunc2);
				autoTrace.addGlobalMiddleware(middlewareFunc3);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchAsyncStacktrace()(err);
		});
	});

	describe('syncStacktrace', () => {
		it('should create a new error where none is given', () => {
			expect(autoTrace.syncStacktrace()).toEqual(jasmine.any(Error));
		});
		it('should wraps non-errors in errors', () => {
			const result = autoTrace.syncStacktrace('non-error');
			expect(result).toEqual(Error('non-error'));
		});
		it('should not re-warp errors', () => {
			const err = new Error('error');
			expect(autoTrace.syncStacktrace(err)).toBe(err);
		});
		it('should apply a single middleware to error', () => {
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc = asyncErr => {
				const msg1 = '1';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2`
					return outputSyncError;
				}
			}
			autoTrace.addGlobalMiddleware(middlewareFunc);

			expect(autoTrace.syncStacktrace(err).message).toEqual('error 1 2');
		});
		it('should apply multiple middlewares and modify the error accordingly', () => {
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc1 = asyncErr => {
				const msg1 = '1a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 1b`
					return outputSyncError;
				}
			}
			const middlewareFunc2 = asyncErr => {
				const msg1 = '2a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2b`
					return outputSyncError;
				}
			}
			const middlewareFunc3 = asyncErr => {
				const msg1 = '3a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 3b`
					return outputSyncError;
				}
			}
			autoTrace.addGlobalMiddleware(middlewareFunc1);
			autoTrace.addGlobalMiddleware(middlewareFunc2);
			autoTrace.addGlobalMiddleware(middlewareFunc3);

			expect(autoTrace.syncStacktrace(err).message).toEqual('error 1a 1b 2a 2b 3a 3b');
		});
	});

	describe('catchSyncStacktrace', () => {
		it('should throw a new error where none is given', (done) => {

			errorCatcher = (ex) => {
				expect(ex).toEqual(jasmine.any(Error));
				expect(ex.stack.indexOf('catchSyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchSyncStacktrace();
		});
		it('should wrap non-errors in errors and throw', (done) => {
			errorCatcher = (ex) => {
				expect(ex).toEqual(Error('non-error'));
				expect(ex.stack.indexOf('catchSyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchSyncStacktrace('non-error');
		});
		it('should throw without re-wrapping errors', (done) => {
			const err = new Error('error');
			errorCatcher = (ex) => {
				expect(ex).toEqual(err);
				expect(ex.stack.indexOf('catchSyncStacktrace')).toEqual(-1);
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchSyncStacktrace(err);
		});
		it('should apply a single extraMiddleware to error', (done) => {
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc = asyncErr => {
				const msg1 = '1';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2`
					return outputSyncError;
				}
			}
			autoTrace.addGlobalMiddleware(middlewareFunc);

			errorCatcher = (ex) => {
				expect(ex).toEqual(Error('error 1 2'));
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchSyncStacktrace(err);
		});
		it('should apply multiple middlewares and modify the error accordingly', (done) => {
			const err = new Error('error');

			//Add new middleware
			const middlewareFunc1 = asyncErr => {
				const msg1 = '1a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 1b`
					return outputSyncError;
				}
			}
			const middlewareFunc2 = asyncErr => {
				const msg1 = '2a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 2b`
					return outputSyncError;
				}
			}
			const middlewareFunc3 = asyncErr => {
				const msg1 = '3a';
				return syncErr => {
					const outputSyncError = syncErr;
					outputSyncError.message += ` ${msg1} 3b`
					return outputSyncError;
				}
			}
			autoTrace.addGlobalMiddleware(middlewareFunc1);
			autoTrace.addGlobalMiddleware(middlewareFunc2);
			autoTrace.addGlobalMiddleware(middlewareFunc3);

			errorCatcher = (ex) => {
				expect(ex).toEqual(Error('error 1a 1b 2a 2b 3a 3b'));
				done();
			};
			process.on('uncaughtException', errorCatcher);

			autoTrace.catchSyncStacktrace(err);
		});
	});

});
