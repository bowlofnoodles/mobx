"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function deepEnhancer(v, _, name) {
    // it is an observable already, done
    if (internal_1.isObservable(v)) return v
    // something that can be converted and mutated?
    if (Array.isArray(v)) return internal_1.observable.array(v, { name })
    if (internal_1.isPlainObject(v)) return internal_1.observable.object(v, undefined, { name })
    if (internal_1.isES6Map(v)) return internal_1.observable.map(v, { name })
    if (internal_1.isES6Set(v)) return internal_1.observable.set(v, { name })
    return v
}
exports.deepEnhancer = deepEnhancer
function shallowEnhancer(v, _, name) {
    if (v === undefined || v === null) return v
    if (
        internal_1.isObservableObject(v) ||
        internal_1.isObservableArray(v) ||
        internal_1.isObservableMap(v) ||
        internal_1.isObservableSet(v)
    )
        return v
    if (Array.isArray(v)) return internal_1.observable.array(v, { name, deep: false })
    if (internal_1.isPlainObject(v))
        return internal_1.observable.object(v, undefined, { name, deep: false })
    if (internal_1.isES6Map(v)) return internal_1.observable.map(v, { name, deep: false })
    if (internal_1.isES6Set(v)) return internal_1.observable.set(v, { name, deep: false })
    return internal_1.fail(
        process.env.NODE_ENV !== "production" &&
            "The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets"
    )
}
exports.shallowEnhancer = shallowEnhancer
function referenceEnhancer(newValue) {
    // never turn into an observable
    return newValue
}
exports.referenceEnhancer = referenceEnhancer
function refStructEnhancer(v, oldValue, name) {
    if (process.env.NODE_ENV !== "production" && internal_1.isObservable(v))
        throw `observable.struct should not be used with observable values`
    if (internal_1.deepEqual(v, oldValue)) return oldValue
    return v
}
exports.refStructEnhancer = refStructEnhancer
