"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function when(predicate, arg1, arg2) {
    if (arguments.length === 1 || (arg1 && typeof arg1 === "object"))
        return whenPromise(predicate, arg1)
    return _when(predicate, arg1, arg2 || {})
}
exports.when = when
function _when(predicate, effect, opts) {
    let timeoutHandle
    if (typeof opts.timeout === "number") {
        timeoutHandle = setTimeout(() => {
            if (!disposer[internal_1.$mobx].isDisposed) {
                disposer()
                const error = new Error("WHEN_TIMEOUT")
                if (opts.onError) opts.onError(error)
                else throw error
            }
        }, opts.timeout)
    }
    opts.name = opts.name || "When@" + internal_1.getNextId()
    const effectAction = internal_1.createAction(opts.name + "-effect", effect)
    const disposer = internal_1.autorun(r => {
        if (predicate()) {
            r.dispose()
            if (timeoutHandle) clearTimeout(timeoutHandle)
            effectAction()
        }
    }, opts)
    return disposer
}
function whenPromise(predicate, opts) {
    if (process.env.NODE_ENV !== "production" && opts && opts.onError)
        return internal_1.fail(`the options 'onError' and 'promise' cannot be combined`)
    let cancel
    const res = new Promise((resolve, reject) => {
        let disposer = _when(predicate, resolve, Object.assign({}, opts, { onError: reject }))
        cancel = () => {
            disposer()
            reject("WHEN_CANCELLED")
        }
    })
    res.cancel = cancel
    return res
}
