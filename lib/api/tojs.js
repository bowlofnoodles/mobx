"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
const defaultOptions = {
    detectCycles: true,
    exportMapsAsObjects: true,
    recurseEverything: false
}
function cache(map, key, value, options) {
    if (options.detectCycles) map.set(key, value)
    return value
}
function toJSHelper(source, options, __alreadySeen) {
    if (!options.recurseEverything && !internal_1.isObservable(source)) return source
    if (typeof source !== "object") return source
    // Directly return null if source is null
    if (source === null) return null
    // Directly return the Date object itself if contained in the observable
    if (source instanceof Date) return source
    if (internal_1.isObservableValue(source))
        return toJSHelper(source.get(), options, __alreadySeen)
    // make sure we track the keys of the object
    if (internal_1.isObservable(source)) internal_1.keys(source)
    const detectCycles = options.detectCycles === true
    if (detectCycles && source !== null && __alreadySeen.has(source)) {
        return __alreadySeen.get(source)
    }
    if (internal_1.isObservableArray(source) || Array.isArray(source)) {
        const res = cache(__alreadySeen, source, [], options)
        const toAdd = source.map(value => toJSHelper(value, options, __alreadySeen))
        res.length = toAdd.length
        for (let i = 0, l = toAdd.length; i < l; i++) res[i] = toAdd[i]
        return res
    }
    if (internal_1.isObservableSet(source) || Object.getPrototypeOf(source) === Set.prototype) {
        if (options.exportMapsAsObjects === false) {
            const res = cache(__alreadySeen, source, new Set(), options)
            source.forEach(value => {
                res.add(toJSHelper(value, options, __alreadySeen))
            })
            return res
        } else {
            const res = cache(__alreadySeen, source, [], options)
            source.forEach(value => {
                res.push(toJSHelper(value, options, __alreadySeen))
            })
            return res
        }
    }
    if (internal_1.isObservableMap(source) || Object.getPrototypeOf(source) === Map.prototype) {
        if (options.exportMapsAsObjects === false) {
            const res = cache(__alreadySeen, source, new Map(), options)
            source.forEach((value, key) => {
                res.set(key, toJSHelper(value, options, __alreadySeen))
            })
            return res
        } else {
            const res = cache(__alreadySeen, source, {}, options)
            source.forEach((value, key) => {
                res[key] = toJSHelper(value, options, __alreadySeen)
            })
            return res
        }
    }
    // Fallback to the situation that source is an ObservableObject or a plain object
    const res = cache(__alreadySeen, source, {}, options)
    internal_1.getPlainObjectKeys(source).forEach(key => {
        res[key] = toJSHelper(source[key], options, __alreadySeen)
    })
    return res
}
function toJS(source, options) {
    // backward compatibility
    if (typeof options === "boolean") options = { detectCycles: options }
    if (!options) options = defaultOptions
    options.detectCycles =
        options.detectCycles === undefined
            ? options.recurseEverything === true
            : options.detectCycles === true
    let __alreadySeen
    if (options.detectCycles) __alreadySeen = new Map()
    return toJSHelper(source, options, __alreadySeen)
}
exports.toJS = toJS
