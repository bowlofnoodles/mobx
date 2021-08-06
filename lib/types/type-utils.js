"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function getAtom(thing, property) {
    if (typeof thing === "object" && thing !== null) {
        if (internal_1.isObservableArray(thing)) {
            if (property !== undefined)
                internal_1.fail(
                    process.env.NODE_ENV !== "production" &&
                        "It is not possible to get index atoms from arrays"
                )
            return thing[internal_1.$mobx].atom
        }
        if (internal_1.isObservableSet(thing)) {
            return thing[internal_1.$mobx]
        }
        if (internal_1.isObservableMap(thing)) {
            const anyThing = thing
            if (property === undefined) return anyThing._keysAtom
            const observable = anyThing._data.get(property) || anyThing._hasMap.get(property)
            if (!observable)
                internal_1.fail(
                    process.env.NODE_ENV !== "production" &&
                        `the entry '${property}' does not exist in the observable map '${getDebugName(
                            thing
                        )}'`
                )
            return observable
        }
        // Initializers run lazily when transpiling to babel, so make sure they are run...
        internal_1.initializeInstance(thing)
        if (property && !thing[internal_1.$mobx]) thing[property] // See #1072
        if (internal_1.isObservableObject(thing)) {
            if (!property)
                return internal_1.fail(
                    process.env.NODE_ENV !== "production" && `please specify a property`
                )
            const observable = thing[internal_1.$mobx].values.get(property)
            if (!observable)
                internal_1.fail(
                    process.env.NODE_ENV !== "production" &&
                        `no observable property '${property}' found on the observable object '${getDebugName(
                            thing
                        )}'`
                )
            return observable
        }
        if (
            internal_1.isAtom(thing) ||
            internal_1.isComputedValue(thing) ||
            internal_1.isReaction(thing)
        ) {
            return thing
        }
    } else if (typeof thing === "function") {
        if (internal_1.isReaction(thing[internal_1.$mobx])) {
            // disposer function
            return thing[internal_1.$mobx]
        }
    }
    return internal_1.fail(
        process.env.NODE_ENV !== "production" && "Cannot obtain atom from " + thing
    )
}
exports.getAtom = getAtom
function getAdministration(thing, property) {
    if (!thing) internal_1.fail("Expecting some object")
    if (property !== undefined) return getAdministration(getAtom(thing, property))
    if (
        internal_1.isAtom(thing) ||
        internal_1.isComputedValue(thing) ||
        internal_1.isReaction(thing)
    )
        return thing
    if (internal_1.isObservableMap(thing) || internal_1.isObservableSet(thing)) return thing
    // Initializers run lazily when transpiling to babel, so make sure they are run...
    internal_1.initializeInstance(thing)
    if (thing[internal_1.$mobx]) return thing[internal_1.$mobx]
    internal_1.fail(
        process.env.NODE_ENV !== "production" && "Cannot obtain administration from " + thing
    )
}
exports.getAdministration = getAdministration
function getDebugName(thing, property) {
    let named
    if (property !== undefined) named = getAtom(thing, property)
    else if (
        internal_1.isObservableObject(thing) ||
        internal_1.isObservableMap(thing) ||
        internal_1.isObservableSet(thing)
    )
        named = getAdministration(thing)
    else named = getAtom(thing) // valid for arrays as well
    return named.name
}
exports.getDebugName = getDebugName
