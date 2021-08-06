"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function interceptReads(thing, propOrHandler, handler) {
    let target
    if (
        internal_1.isObservableMap(thing) ||
        internal_1.isObservableArray(thing) ||
        internal_1.isObservableValue(thing)
    ) {
        target = internal_1.getAdministration(thing)
    } else if (internal_1.isObservableObject(thing)) {
        if (typeof propOrHandler !== "string")
            return internal_1.fail(
                process.env.NODE_ENV !== "production" &&
                    `InterceptReads can only be used with a specific property, not with an object in general`
            )
        target = internal_1.getAdministration(thing, propOrHandler)
    } else {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `Expected observable map, object or array as first array`
        )
    }
    if (target.dehancer !== undefined)
        return internal_1.fail(
            process.env.NODE_ENV !== "production" && `An intercept reader was already established`
        )
    target.dehancer = typeof propOrHandler === "function" ? propOrHandler : handler
    return () => {
        target.dehancer = undefined
    }
}
exports.interceptReads = interceptReads
