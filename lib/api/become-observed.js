"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function onBecomeObserved(thing, arg2, arg3) {
    return interceptHook("onBecomeObserved", thing, arg2, arg3)
}
exports.onBecomeObserved = onBecomeObserved
function onBecomeUnobserved(thing, arg2, arg3) {
    return interceptHook("onBecomeUnobserved", thing, arg2, arg3)
}
exports.onBecomeUnobserved = onBecomeUnobserved
function interceptHook(hook, thing, arg2, arg3) {
    const atom =
        typeof arg2 === "string" ? internal_1.getAtom(thing, arg2) : internal_1.getAtom(thing)
    const cb = typeof arg2 === "string" ? arg3 : arg2
    const listenersKey = `${hook}Listeners`
    if (atom[listenersKey]) {
        atom[listenersKey].add(cb)
    } else {
        atom[listenersKey] = new Set([cb])
    }
    const orig = atom[hook]
    if (typeof orig !== "function")
        return internal_1.fail(
            process.env.NODE_ENV !== "production" && "Not an atom that can be (un)observed"
        )
    return function() {
        const hookListeners = atom[listenersKey]
        if (hookListeners) {
            hookListeners.delete(cb)
            if (hookListeners.size === 0) {
                delete atom[listenersKey]
            }
        }
    }
}
