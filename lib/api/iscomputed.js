"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function _isComputed(value, property) {
    if (value === null || value === undefined) return false
    if (property !== undefined) {
        if (internal_1.isObservableObject(value) === false) return false
        if (!value[internal_1.$mobx].values.has(property)) return false
        const atom = internal_1.getAtom(value, property)
        return internal_1.isComputedValue(atom)
    }
    return internal_1.isComputedValue(value)
}
exports._isComputed = _isComputed
function isComputed(value) {
    if (arguments.length > 1)
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `isComputed expects only 1 argument. Use isObservableProp to inspect the observability of a property`
        )
    return _isComputed(value)
}
exports.isComputed = isComputed
function isComputedProp(value, propName) {
    if (typeof propName !== "string")
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `isComputed expected a property name as second argument`
        )
    return _isComputed(value, propName)
}
exports.isComputedProp = isComputedProp
