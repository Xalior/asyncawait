﻿//import references = require('references');
//import Fiber = require('fibers');
//import semaphore = require('../semaphore');
//import fiberPool = require('../fiberPool');
//import Coroutine = AsyncAwait.Async.Coroutine;
//export = CoroutineBase;


//var x = {
//    invoke: (co) => {},
//    return: (co, result) => {},
//    throw: (co, error) => {},
//    yield: (co, value) => {},
//    finally: (co) => {}
//}



//class CoroutineBase implements Coroutine {
//    constructor(proc: Function) {
//        this._proc = proc;
//        this._fiber = null;
//    }

//    invoke(): any {
//        return this;
//    }

//    return(result: any) { }

//    throw(error: any) { }

//    yield(value: any) { }

//    finally() {
//    }

//    _proc: Function;

//    _fiber: Fiber;
//}