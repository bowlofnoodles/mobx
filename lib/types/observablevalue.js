"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
class ObservableValue extends internal_1.Atom {
    constructor(
        value,
        enhancer,
        name = "ObservableValue@" + internal_1.getNextId(),
        notifySpy = true,
        equals = internal_1.comparer.default
    ) {
        super(name)
        this.enhancer = enhancer
        this.name = name
        this.equals = equals
        this.hasUnreportedChange = false
        this.value = enhancer(value, undefined, name)
        if (notifySpy && internal_1.isSpyEnabled() && process.env.NODE_ENV !== "production") {
            // only notify spy if this is a stand-alone observable
            internal_1.spyReport({ type: "create", name: this.name, newValue: "" + this.value })
        }
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined) return this.dehancer(value)
        return value
    }
    set(newValue) {
        const oldValue = this.value
        newValue = this.prepareNewValue(newValue)
        if (newValue !== internal_1.globalState.UNCHANGED) {
            const notifySpy = internal_1.isSpyEnabled()
            if (notifySpy && process.env.NODE_ENV !== "production") {
                internal_1.spyReportStart({
                    type: "update",
                    name: this.name,
                    newValue,
                    oldValue
                })
            }
            this.setNewValue(newValue)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        }
    }
    prepareNewValue(newValue) {
        internal_1.checkIfStateModificationsAreAllowed(this)
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                object: this,
                type: "update",
                newValue
            })
            if (!change) return internal_1.globalState.UNCHANGED
            newValue = change.newValue
        }
        // apply modifier
        newValue = this.enhancer(newValue, this.value, this.name)
        return this.equals(this.value, newValue) ? internal_1.globalState.UNCHANGED : newValue
    }
    setNewValue(newValue) {
        const oldValue = this.value
        this.value = newValue
        this.reportChanged()
        if (internal_1.hasListeners(this)) {
            internal_1.notifyListeners(this, {
                type: "update",
                object: this,
                newValue,
                oldValue
            })
        }
    }
    get() {
        this.reportObserved()
        return this.dehanceValue(this.value)
    }
    intercept(handler) {
        return internal_1.registerInterceptor(this, handler)
    }
    observe(listener, fireImmediately) {
        if (fireImmediately)
            listener({
                object: this,
                type: "update",
                newValue: this.value,
                oldValue: undefined
            })
        return internal_1.registerListener(this, listener)
    }
    toJSON() {
        return this.get()
    }
    toString() {
        return `${this.name}[${this.value}]`
    }
    valueOf() {
        return internal_1.toPrimitive(this.get())
    }
    [Symbol.toPrimitive]() {
        return this.valueOf()
    }
}
exports.ObservableValue = ObservableValue
exports.isObservableValue = internal_1.createInstanceofPredicate("ObservableValue", ObservableValue)
