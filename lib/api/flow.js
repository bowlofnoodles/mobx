"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
let generatorId = 0
function flow(generator) {
    if (arguments.length !== 1)
        internal_1.fail(
            !!process.env.NODE_ENV && `Flow expects one 1 argument and cannot be used as decorator`
        )
    const name = generator.name || "<unnamed flow>"
    // Implementation based on https://github.com/tj/co/blob/master/index.js
    return function() {
        const ctx = this
        const args = arguments
        const runId = ++generatorId
        const gen = internal_1
            .action(`${name} - runid: ${runId} - init`, generator)
            .apply(ctx, args)
        let rejector
        let pendingPromise = undefined
        const promise = new Promise(function(resolve, reject) {
            let stepId = 0
            rejector = reject
            function onFulfilled(res) {
                pendingPromise = undefined
                let ret
                try {
                    ret = internal_1
                        .action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.next)
                        .call(gen, res)
                } catch (e) {
                    return reject(e)
                }
                next(ret)
            }
            function onRejected(err) {
                pendingPromise = undefined
                let ret
                try {
                    ret = internal_1
                        .action(`${name} - runid: ${runId} - yield ${stepId++}`, gen.throw)
                        .call(gen, err)
                } catch (e) {
                    return reject(e)
                }
                next(ret)
            }
            function next(ret) {
                if (ret && typeof ret.then === "function") {
                    // an async iterator
                    ret.then(next, reject)
                    return
                }
                if (ret.done) return resolve(ret.value)
                pendingPromise = Promise.resolve(ret.value)
                return pendingPromise.then(onFulfilled, onRejected)
            }
            onFulfilled(undefined) // kick off the process
        })
        promise.cancel = internal_1.action(`${name} - runid: ${runId} - cancel`, function() {
            try {
                if (pendingPromise) cancelPromise(pendingPromise)
                // Finally block can return (or yield) stuff..
                const res = gen.return()
                // eat anything that promise would do, it's cancelled!
                const yieldedPromise = Promise.resolve(res.value)
                yieldedPromise.then(internal_1.noop, internal_1.noop)
                cancelPromise(yieldedPromise) // maybe it can be cancelled :)
                // reject our original promise
                rejector(new Error("FLOW_CANCELLED"))
            } catch (e) {
                rejector(e) // there could be a throwing finally block
            }
        })
        return promise
    }
}
exports.flow = flow
function cancelPromise(promise) {
    if (typeof promise.cancel === "function") promise.cancel()
}
