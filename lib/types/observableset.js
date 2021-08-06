"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
var _a
;("use strict")
const internal_1 = require("../internal")
const ObservableSetMarker = {}
class ObservableSet {
    constructor(
        initialData,
        enhancer = internal_1.deepEnhancer,
        name = "ObservableSet@" + internal_1.getNextId()
    ) {
        this.name = name
        this[_a] = ObservableSetMarker
        this._data = new Set()
        this._atom = internal_1.createAtom(this.name)
        this[Symbol.toStringTag] = "Set"
        if (typeof Set !== "function") {
            throw new Error(
                "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js"
            )
        }
        this.enhancer = (newV, oldV) => enhancer(newV, oldV, name)
        if (initialData) {
            this.replace(initialData)
        }
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined) {
            return this.dehancer(value)
        }
        return value
    }
    clear() {
        internal_1.transaction(() => {
            internal_1.untracked(() => {
                for (const value of this._data.values()) this.delete(value)
            })
        })
    }
    forEach(callbackFn, thisArg) {
        for (const value of this) {
            callbackFn.call(thisArg, value, value, this)
        }
    }
    get size() {
        this._atom.reportObserved()
        return this._data.size
    }
    add(value) {
        internal_1.checkIfStateModificationsAreAllowed(this._atom)
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                type: "add",
                object: this,
                newValue: value
            })
            if (!change) return this
            // TODO: ideally, value = change.value would be done here, so that values can be
            // changed by interceptor. Same applies for other Set and Map api's.
        }
        if (!this.has(value)) {
            internal_1.transaction(() => {
                this._data.add(this.enhancer(value, undefined))
                this._atom.reportChanged()
            })
            const notifySpy = internal_1.isSpyEnabled()
            const notify = internal_1.hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          type: "add",
                          object: this,
                          newValue: value
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(change)
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        }
        return this
    }
    delete(value) {
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                type: "delete",
                object: this,
                oldValue: value
            })
            if (!change) return false
        }
        if (this.has(value)) {
            const notifySpy = internal_1.isSpyEnabled()
            const notify = internal_1.hasListeners(this)
            const change =
                notify || notifySpy
                    ? {
                          type: "delete",
                          object: this,
                          oldValue: value
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(Object.assign({}, change, { name: this.name }))
            internal_1.transaction(() => {
                this._atom.reportChanged()
                this._data.delete(value)
            })
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
            return true
        }
        return false
    }
    has(value) {
        this._atom.reportObserved()
        return this._data.has(this.dehanceValue(value))
    }
    entries() {
        let nextIndex = 0
        const keys = Array.from(this.keys())
        const values = Array.from(this.values())
        return internal_1.makeIterable({
            next() {
                const index = nextIndex
                nextIndex += 1
                return index < values.length
                    ? { value: [keys[index], values[index]], done: false }
                    : { done: true }
            }
        })
    }
    keys() {
        return this.values()
    }
    values() {
        this._atom.reportObserved()
        const self = this
        let nextIndex = 0
        const observableValues = Array.from(this._data.values())
        return internal_1.makeIterable({
            next() {
                return nextIndex < observableValues.length
                    ? { value: self.dehanceValue(observableValues[nextIndex++]), done: false }
                    : { done: true }
            }
        })
    }
    replace(other) {
        if (exports.isObservableSet(other)) {
            other = other.toJS()
        }
        internal_1.transaction(() => {
            if (Array.isArray(other)) {
                this.clear()
                other.forEach(value => this.add(value))
            } else if (internal_1.isES6Set(other)) {
                this.clear()
                other.forEach(value => this.add(value))
            } else if (other !== null && other !== undefined) {
                internal_1.fail("Cannot initialize set from " + other)
            }
        })
        return this
    }
    observe(listener, fireImmediately) {
        // TODO 'fireImmediately' can be true?
        process.env.NODE_ENV !== "production" &&
            internal_1.invariant(
                fireImmediately !== true,
                "`observe` doesn't support fireImmediately=true in combination with sets."
            )
        return internal_1.registerListener(this, listener)
    }
    intercept(handler) {
        return internal_1.registerInterceptor(this, handler)
    }
    toJS() {
        return new Set(this)
    }
    toString() {
        return this.name + "[ " + Array.from(this).join(", ") + " ]"
    }
    [((_a = internal_1.$mobx), Symbol.iterator)]() {
        return this.values()
    }
}
exports.ObservableSet = ObservableSet
exports.isObservableSet = internal_1.createInstanceofPredicate("ObservableSet", ObservableSet)
