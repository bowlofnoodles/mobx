"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function trace(...args) {
    let enterBreakPoint = false
    if (typeof args[args.length - 1] === "boolean") enterBreakPoint = args.pop()
    const derivation = getAtomFromArgs(args)
    if (!derivation) {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly`
        )
    }
    if (derivation.isTracing === internal_1.TraceMode.NONE) {
        console.log(`[mobx.trace] '${derivation.name}' tracing enabled`)
    }
    derivation.isTracing = enterBreakPoint ? internal_1.TraceMode.BREAK : internal_1.TraceMode.LOG
}
exports.trace = trace
function getAtomFromArgs(args) {
    switch (args.length) {
        case 0:
            return internal_1.globalState.trackingDerivation
        case 1:
            return internal_1.getAtom(args[0])
        case 2:
            return internal_1.getAtom(args[0], args[1])
    }
}
