﻿import references = require('references');
import chai = require('chai');
import Promise = require('bluebird');
import async = require('asyncawait/async');
import await = require('asyncawait/await');
import yield_ = require('asyncawait/yield');
var expect = chai.expect;


describe('async.iterable.thunk(...)', () => {

    var foo = async.iterable.thunk ((count: number, accum?: any[]) => {
        if (count < 1 || count > 9) throw new Error('out of range');
        for (var i = 1; i <= count; ++i) {
            if (accum) accum.push(111 * i);
            yield_ (111 * i);
        }
        return 'done';
    });


    describe('returns a function', () => {

        it('which returns an async iterator with next() and forEach() methods', () => {
            var syncResult = foo();
            expect(syncResult).is.an('object');
            expect(syncResult.next).is.a('function');
            expect(syncResult.forEach).is.a('function');
        });
    });


    describe('provides an iterator whose next() method', () => {

        it('synchronously returns a thunk', () => {
            var iter = foo(3);
            var syncResult = iter.next();
            expect(syncResult).instanceOf(Function);
            expect(syncResult.length).to.equal(1);
        });

        it('does not execute if the thunk is not invoked', done => {
            var arr = [], thunk = foo(3, arr).next();
            Promise.delay(50)
            .then(() => expect(arr).to.be.empty)
            .then(() => done())
            .catch(done);
            expect(arr).to.be.empty;
        });

        it('executes if the thunk is invoked without a callback', done => {
            var arr = [], iter = foo(3, arr);
            iter.next()();
            Promise.delay(20)
            .then(result => expect(arr).to.deep.equal([111]))
            .then(() => done())
            .catch(done);
        });

        it('begins executing synchronously and completes asynchronously', done => {
            var arr = [], iter = foo(3, arr), next = () => Promise.promisify(iter.next())();
            next()
            .then(() => expect(arr).to.deep.equal([111, '***']))
            .then(() => done())
            .catch(done);
            expect(arr).to.deep.equal([111]);
            arr.push('***');
        });

        it("preserves the 'this' context of the call", async.cps (() => {
            var foo = { bar: async.iterable.thunk (function () { yield_ (this); return 'done'; }) }, baz = {x:7};
            var iter = foo.bar(), next = Promise.promisify(iter.next());
            expect(await (next())).to.deep.equal({ done: false, value: foo });
            expect(await (next())).to.deep.equal({ done: true, value: 'done' });
            iter = foo.bar.call(baz), next = Promise.promisify(iter.next());
            expect(await (next())).to.deep.equal({ done: false, value: baz });
            expect(await (next())).to.deep.equal({ done: true, value: 'done' });
        }));

        it('eventually resolves with the definition\'s yielded value', async.cps (() => {
            var iter = foo(3), next = () => Promise.promisify(iter.next())();
            expect(await (next())).to.deep.equal({ done: false, value: 111 });
            expect(await (next())).to.deep.equal({ done: false, value: 222 });
            expect(await (next())).to.deep.equal({ done: false, value: 333 });
            expect(await (next())).to.deep.equal({ done: true, value: 'done' });
        }));

        it('eventually rejects with the definition\'s thrown value', async.cps (() => {
            var err, iter = foo(20), next = () => Promise.promisify(iter.next())();
            expect(() => await (next())).to.throw(Error, 'out of range');
        }));

        it('eventually rejects if the iteration is already finished', async.cps(() => {
            var err, iter = foo(1), next = () => Promise.promisify(iter.next())();
            expect(await (next())).to.deep.equal({ done: false, value: 111 });
            expect(await (next())).to.deep.equal({ done: true, value: 'done' });
            expect(() => await (next())).to.throw(Error);
        }));

        it('works with await', done => {
            var foo = async.iterable.thunk (() => { yield_ (await (Promise.delay(20).then(() => 'blah'))); });
            var iter = foo();
            Promise.promisify(iter.next())()
            .then(result => expect(result).to.deep.equal({done:false,value:'blah'}))
            .then(() => done())
            .catch(done);
        });
    });


    describe('provides an iterator whose forEach() method', () => {

        function nullFunc() { }

        it('expects a single callback as its argument', () => {
            expect(() => (<any> foo(3)).forEach()).to.throw(Error);
            expect(() => (<any> foo(3)).forEach(1)).to.throw(Error);
            expect(() => (<any> foo(3)).forEach(1, nullFunc)).to.throw(Error);
        });

        it('synchronously returns a thunk', () => {
            var iter = foo(3);
            var syncResult = iter.forEach(nullFunc);
            expect(syncResult).instanceOf(Function);
            expect(syncResult.length).to.equal(1);
        });

        it('does not execute if the thunk is not invoked', done => {
            var arr = [], thunk = foo(3, arr).forEach(nullFunc);
            Promise.delay(50)
            .then(() => expect(arr).to.be.empty)
            .then(() => done())
            .catch(done);
            expect(arr).to.be.empty;
        });

        it('executes if the thunk is invoked without a callback', done => {
            var arr = [], iter = foo(3, arr);
            iter.forEach(nullFunc)();
            Promise.delay(20)
            .then(result => expect(arr).to.deep.equal([111, 222, 333]))
            .then(() => done())
            .catch(done);
        });

        it('begins executing synchronously and completes asynchronously', done => {
            var arr = [], iter = foo(3, arr), forEach = cb => Promise.promisify(iter.forEach(cb))();
            forEach(nullFunc)
            .then(() => expect(arr).to.deep.equal([111, '***', 222, 333]))
            .then(() => done())
            .catch(done);
            expect(arr).to.deep.equal([111]);
            arr.push('***');
        });

        it('iterates over all yielded values', async.cps(() => {
            var arr = [], iter = foo(4), forEach = cb => Promise.promisify(iter.forEach(cb))();
            await (forEach(val => arr.push(val)));
            expect(arr).to.deep.equal([111, 222, 333, 444]);
        }));

        it('eventually resolves with the definition\'s returned value', async.cps(() => {
            var arr = [], iter = foo(7, arr), forEach = cb => Promise.promisify(iter.forEach(cb))();
            var result = await (forEach(nullFunc));
            expect(result).to.equal('done');
            expect(arr.length).to.equal(7);
        }));

        it('eventually rejects with the definition\'s thrown value', async.cps(() => {
            var err, iter = foo(20), forEach = cb => Promise.promisify(iter.forEach(cb))();
            expect(() => await (forEach(nullFunc))).to.throw(Error, 'out of range');
        }));

        it('eventually rejects if the iteration is already finished', async.cps(() => {
            var err, iter = foo(1), forEach = cb => Promise.promisify(iter.forEach(cb))();
            await (forEach(nullFunc));
            expect (() => await (forEach(nullFunc))).to.throw(Error);
        }));

        it('works with await', done => {
            var foo = async.iterable.thunk (() => { yield_ (await (Promise.delay(20).then(() => 'blah'))); }), arr = [];
            var iter = foo();
            Promise.promisify(iter.forEach(val => arr.push(val)))()
            .then(result => expect(result).to.not.exist)
            .then(() => expect(arr).to.deep.equal(['blah']))
            .then(() => done())
            .catch(done);
        });
    });
});