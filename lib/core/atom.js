"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
exports.$mobx = Symbol("mobx administration")
class Atom {
    /**
     * Create a new atom. For debugging purposes it is recommended to give it a name.
     * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
     */
    constructor(name = "Atom@" + internal_1.getNextId()) {
        this.name = name
        this.isPendingUnobservation = false // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed
        this.isBeingObserved = false
        this.observers = new Set()
        this.diffValue = 0
        this.lastAccessedBy = 0
        this.lowestObserverState = internal_1.IDerivationState.NOT_TRACKING
    }
    onBecomeObserved() {
        if (this.onBecomeObservedListeners) {
            this.onBecomeObservedListeners.forEach(listener => listener())
        }
    }
    onBecomeUnobserved() {
        if (this.onBecomeUnobservedListeners) {
            this.onBecomeUnobservedListeners.forEach(listener => listener())
        }
    }
    /**
     * Invoke this method to notify mobx that your atom has been used somehow.
     * Returns true if there is currently a reactive context.
     */
    reportObserved() {
        return internal_1.reportObserved(this)
    }
    /**
     * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
     */
    reportChanged() {
        internal_1.startBatch()
        internal_1.propagateChanged(this)
        internal_1.endBatch()
    }
    toString() {
        return this.name
    }
}
exports.Atom = Atom
exports.isAtom = internal_1.createInstanceofPredicate("Atom", Atom)
function createAtom(
    name,
    onBecomeObservedHandler = internal_1.noop,
    onBecomeUnobservedHandler = internal_1.noop
) {
    const atom = new Atom(name)
    // default `noop` listener will not initialize the hook Set
    if (onBecomeObservedHandler !== internal_1.noop) {
        internal_1.onBecomeObserved(atom, onBecomeObservedHandler)
    }
    if (onBecomeUnobservedHandler !== internal_1.noop) {
        internal_1.onBecomeUnobserved(atom, onBecomeUnobservedHandler)
    }
    return atom
}
exports.createAtom = createAtom
