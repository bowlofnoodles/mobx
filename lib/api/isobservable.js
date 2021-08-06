"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function _isObservable(value, property) {
    if (value === null || value === undefined) return false
    if (property !== undefined) {
        if (
            process.env.NODE_ENV !== "production" &&
            (internal_1.isObservableMap(value) || internal_1.isObservableArray(value))
        )
            return internal_1.fail(
                "isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead."
            )
        if (internal_1.isObservableObject(value)) {
            return value[internal_1.$mobx].values.has(property)
        }
        return false
    }
    // For first check, see #701
    return (
        internal_1.isObservableObject(value) ||
        !!value[internal_1.$mobx] ||
        internal_1.isAtom(value) ||
        internal_1.isReaction(value) ||
        internal_1.isComputedValue(value)
    )
}
function isObservable(value) {
    if (arguments.length !== 1)
        internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property`
        )
    return _isObservable(value)
}
exports.isObservable = isObservable
function isObservableProp(value, propName) {
    if (typeof propName !== "string")
        return internal_1.fail(
            process.env.NODE_ENV !== "production" && `expected a property name as second argument`
        )
    return _isObservable(value, propName)
}
exports.isObservableProp = isObservableProp
