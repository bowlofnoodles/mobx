"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
exports.OBFUSCATED_ERROR =
    "An invariant failed, however the error is obfuscated because this is an production build."
exports.EMPTY_ARRAY = []
Object.freeze(exports.EMPTY_ARRAY)
exports.EMPTY_OBJECT = {}
Object.freeze(exports.EMPTY_OBJECT)
function getNextId() {
    return ++internal_1.globalState.mobxGuid
}
exports.getNextId = getNextId
function fail(message) {
    invariant(false, message)
    throw "X" // unreachable
}
exports.fail = fail
function invariant(check, message) {
    if (!check) throw new Error("[mobx] " + (message || exports.OBFUSCATED_ERROR))
}
exports.invariant = invariant
/**
 * Prints a deprecation message, but only one time.
 * Returns false if the deprecated message was already printed before
 */
const deprecatedMessages = []
function deprecated(msg, thing) {
    if (process.env.NODE_ENV === "production") return false
    if (thing) {
        return deprecated(`'${msg}', use '${thing}' instead.`)
    }
    if (deprecatedMessages.indexOf(msg) !== -1) return false
    deprecatedMessages.push(msg)
    console.error("[mobx] Deprecated: " + msg)
    return true
}
exports.deprecated = deprecated
/**
 * Makes sure that the provided function is invoked at most once.
 */
function once(func) {
    let invoked = false
    return function() {
        if (invoked) return
        invoked = true
        return func.apply(this, arguments)
    }
}
exports.once = once
exports.noop = () => {}
function unique(list) {
    const res = []
    list.forEach(item => {
        if (res.indexOf(item) === -1) res.push(item)
    })
    return res
}
exports.unique = unique
function isObject(value) {
    return value !== null && typeof value === "object"
}
exports.isObject = isObject
function isPlainObject(value) {
    if (value === null || typeof value !== "object") return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}
exports.isPlainObject = isPlainObject
function makeNonEnumerable(object, propNames) {
    for (let i = 0; i < propNames.length; i++) {
        addHiddenProp(object, propNames[i], object[propNames[i]])
    }
}
exports.makeNonEnumerable = makeNonEnumerable
// 让propName不可枚举
function addHiddenProp(object, propName, value) {
    Object.defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value
    })
}
exports.addHiddenProp = addHiddenProp
function addHiddenFinalProp(object, propName, value) {
    Object.defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value
    })
}
exports.addHiddenFinalProp = addHiddenFinalProp
function isPropertyConfigurable(object, prop) {
    const descriptor = Object.getOwnPropertyDescriptor(object, prop)
    return !descriptor || (descriptor.configurable !== false && descriptor.writable !== false)
}
exports.isPropertyConfigurable = isPropertyConfigurable
function assertPropertyConfigurable(object, prop) {
    if (process.env.NODE_ENV !== "production" && !isPropertyConfigurable(object, prop))
        fail(
            `Cannot make property '${prop.toString()}' observable, it is not configurable and writable in the target object`
        )
}
exports.assertPropertyConfigurable = assertPropertyConfigurable
function createInstanceofPredicate(name, clazz) {
    const propName = "isMobX" + name
    clazz.prototype[propName] = true
    return function(x) {
        return isObject(x) && x[propName] === true
    }
}
exports.createInstanceofPredicate = createInstanceofPredicate
/**
 * Returns whether the argument is an array, disregarding observability.
 */
function isArrayLike(x) {
    return Array.isArray(x) || internal_1.isObservableArray(x)
}
exports.isArrayLike = isArrayLike
function isES6Map(thing) {
    return thing instanceof Map
}
exports.isES6Map = isES6Map
function isES6Set(thing) {
    return thing instanceof Set
}
exports.isES6Set = isES6Set
/**
 * Returns the following: own keys, prototype keys & own symbol keys, if they are enumerable.
 */
function getPlainObjectKeys(object) {
    const enumerables = new Set()
    for (let key in object) enumerables.add(key) // *all* enumerables
    Object.getOwnPropertySymbols(object).forEach(k => {
        if (Object.getOwnPropertyDescriptor(object, k).enumerable) enumerables.add(k)
    }) // *own* symbols
    // Note: this implementation is missing enumerable, inherited, symbolic property names! That would however pretty expensive to add,
    // as there is no efficient iterator that returns *all* properties
    return Array.from(enumerables)
}
exports.getPlainObjectKeys = getPlainObjectKeys
function stringifyKey(key) {
    if (key && key.toString) return key.toString()
    else return new String(key).toString()
}
exports.stringifyKey = stringifyKey
function getMapLikeKeys(map) {
    if (isPlainObject(map)) return Object.keys(map)
    if (Array.isArray(map)) return map.map(([key]) => key)
    if (isES6Map(map) || internal_1.isObservableMap(map)) return Array.from(map.keys())
    return fail(`Cannot get keys from '${map}'`)
}
exports.getMapLikeKeys = getMapLikeKeys
function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value
}
exports.toPrimitive = toPrimitive
