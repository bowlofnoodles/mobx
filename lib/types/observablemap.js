"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
var _a
;("use strict")
const internal_1 = require("../internal")
const ObservableMapMarker = {}
// just extend Map? See also https://gist.github.com/nestharus/13b4d74f2ef4a2f4357dbd3fc23c1e54
// But: https://github.com/mobxjs/mobx/issues/1556
class ObservableMap {
    constructor(
        initialData,
        enhancer = internal_1.deepEnhancer,
        name = "ObservableMap@" + internal_1.getNextId()
    ) {
        this.enhancer = enhancer
        this.name = name
        this[_a] = ObservableMapMarker
        this._keysAtom = internal_1.createAtom(`${this.name}.keys()`)
        this[Symbol.toStringTag] = "Map"
        if (typeof Map !== "function") {
            throw new Error(
                "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js"
            )
        }
        this._data = new Map()
        this._hasMap = new Map()
        this.merge(initialData)
    }
    _has(key) {
        return this._data.has(key)
    }
    has(key) {
        if (!internal_1.globalState.trackingDerivation) return this._has(key)
        let entry = this._hasMap.get(key)
        if (!entry) {
            // todo: replace with atom (breaking change)
            const newEntry = (entry = new internal_1.ObservableValue(
                this._has(key),
                internal_1.referenceEnhancer,
                `${this.name}.${internal_1.stringifyKey(key)}?`,
                false
            ))
            this._hasMap.set(key, newEntry)
            internal_1.onBecomeUnobserved(newEntry, () => this._hasMap.delete(key))
        }
        return entry.get()
    }
    set(key, value) {
        const hasKey = this._has(key)
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                type: hasKey ? "update" : "add",
                object: this,
                newValue: value,
                name: key
            })
            if (!change) return this
            value = change.newValue
        }
        if (hasKey) {
            this._updateValue(key, value)
        } else {
            this._addValue(key, value)
        }
        return this
    }
    delete(key) {
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                type: "delete",
                object: this,
                name: key
            })
            if (!change) return false
        }
        if (this._has(key)) {
            const notifySpy = internal_1.isSpyEnabled()
            const notify = internal_1.hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          type: "delete",
                          object: this,
                          oldValue: this._data.get(key).value,
                          name: key
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
            internal_1.transaction(() => {
                this._keysAtom.reportChanged()
                this._updateHasMapEntry(key, false)
                const observable = this._data.get(key)
                observable.setNewValue(undefined)
                this._data.delete(key)
            })
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
            return true
        }
        return false
    }
    _updateHasMapEntry(key, value) {
        let entry = this._hasMap.get(key)
        if (entry) {
            entry.setNewValue(value)
        }
    }
    _updateValue(key, newValue) {
        const observable = this._data.get(key)
        newValue = observable.prepareNewValue(newValue)
        if (newValue !== internal_1.globalState.UNCHANGED) {
            const notifySpy = internal_1.isSpyEnabled()
            const notify = internal_1.hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          type: "update",
                          object: this,
                          oldValue: observable.value,
                          name: key,
                          newValue
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
            observable.setNewValue(newValue)
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        }
    }
    _addValue(key, newValue) {
        internal_1.checkIfStateModificationsAreAllowed(this._keysAtom)
        internal_1.transaction(() => {
            const observable = new internal_1.ObservableValue(
                newValue,
                this.enhancer,
                `${this.name}.${internal_1.stringifyKey(key)}`,
                false
            )
            this._data.set(key, observable)
            newValue = observable.value // value might have been changed
            this._updateHasMapEntry(key, true)
            this._keysAtom.reportChanged()
        })
        const notifySpy = internal_1.isSpyEnabled()
        const notify = internal_1.hasListeners(this)
        const change =
            notify || notifySpy
                ? {
                      type: "add",
                      object: this,
                      name: key,
                      newValue
                  }
                : null
        if (notifySpy && process.env.NODE_ENV !== "production")
            internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
        if (notify) internal_1.notifyListeners(this, change)
        if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
    }
    get(key) {
        if (this.has(key)) return this.dehanceValue(this._data.get(key).get())
        return this.dehanceValue(undefined)
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined) {
            return this.dehancer(value)
        }
        return value
    }
    keys() {
        this._keysAtom.reportObserved()
        return this._data.keys()
    }
    values() {
        const self = this
        let nextIndex = 0
        const keys = Array.from(this.keys())
        return internal_1.makeIterable({
            next() {
                return nextIndex < keys.length
                    ? { value: self.get(keys[nextIndex++]), done: false }
                    : { done: true }
            }
        })
    }
    entries() {
        const self = this
        let nextIndex = 0
        const keys = Array.from(this.keys())
        return internal_1.makeIterable({
            next: function() {
                if (nextIndex < keys.length) {
                    const key = keys[nextIndex++]
                    return {
                        value: [key, self.get(key)],
                        done: false
                    }
                }
                return { done: true }
            }
        })
    }
    [((_a = internal_1.$mobx), Symbol.iterator)]() {
        return this.entries()
    }
    forEach(callback, thisArg) {
        for (const [key, value] of this) callback.call(thisArg, value, key, this)
    }
    /** Merge another object into this object, returns this. */
    merge(other) {
        if (exports.isObservableMap(other)) {
            other = other.toJS()
        }
        internal_1.transaction(() => {
            if (internal_1.isPlainObject(other))
                internal_1.getPlainObjectKeys(other).forEach(key => this.set(key, other[key]))
            else if (Array.isArray(other)) other.forEach(([key, value]) => this.set(key, value))
            else if (internal_1.isES6Map(other)) {
                if (other.constructor !== Map)
                    internal_1.fail("Cannot initialize from classes that inherit from Map: " + other.constructor.name); // prettier-ignore
                other.forEach((value, key) => this.set(key, value))
            } else if (other !== null && other !== undefined)
                internal_1.fail("Cannot initialize map from " + other)
        })
        return this
    }
    clear() {
        internal_1.transaction(() => {
            internal_1.untracked(() => {
                for (const key of this.keys()) this.delete(key)
            })
        })
    }
    replace(values) {
        internal_1.transaction(() => {
            // grab all the keys that are present in the new map but not present in the current map
            // and delete them from the map, then merge the new map
            // this will cause reactions only on changed values
            const newKeys = internal_1.getMapLikeKeys(values)
            const oldKeys = Array.from(this.keys())
            const missingKeys = oldKeys.filter(k => newKeys.indexOf(k) === -1)
            missingKeys.forEach(k => this.delete(k))
            this.merge(values)
        })
        return this
    }
    get size() {
        this._keysAtom.reportObserved()
        return this._data.size
    }
    /**
     * Returns a plain object that represents this map.
     * Note that all the keys being stringified.
     * If there are duplicating keys after converting them to strings, behaviour is undetermined.
     */
    toPOJO() {
        const res = {}
        for (const [key, value] of this) {
            // We lie about symbol key types due to https://github.com/Microsoft/TypeScript/issues/1863
            res[typeof key === "symbol" ? key : internal_1.stringifyKey(key)] = value
        }
        return res
    }
    /**
     * Returns a shallow non observable object clone of this map.
     * Note that the values migth still be observable. For a deep clone use mobx.toJS.
     */
    toJS() {
        return new Map(this)
    }
    toJSON() {
        // Used by JSON.stringify
        return this.toPOJO()
    }
    toString() {
        return (
            this.name +
            "[{ " +
            Array.from(this.keys())
                .map(key => `${internal_1.stringifyKey(key)}: ${"" + this.get(key)}`)
                .join(", ") +
            " }]"
        )
    }
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe(listener, fireImmediately) {
        process.env.NODE_ENV !== "production" &&
            internal_1.invariant(
                fireImmediately !== true,
                "`observe` doesn't support fireImmediately=true in combination with maps."
            )
        return internal_1.registerListener(this, listener)
    }
    intercept(handler) {
        return internal_1.registerInterceptor(this, handler)
    }
}
exports.ObservableMap = ObservableMap
/* 'var' fixes small-build issue */
exports.isObservableMap = internal_1.createInstanceofPredicate("ObservableMap", ObservableMap)
