"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */
class ComputedValue {
    /**
     * Create a new computed value based on a function expression.
     *
     * The `name` property is for debug purposes only.
     *
     * The `equals` property specifies the comparer function to use to determine if a newly produced
     * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
     * compares based on identity comparison (===), and `structualComparer` deeply compares the structure.
     * Structural comparison can be convenient if you always produce a new aggregated object and
     * don't want to notify observers if it is structurally the same.
     * This is useful for working with vectors, mouse coordinates etc.
     */
    constructor(options) {
        this.dependenciesState = internal_1.IDerivationState.NOT_TRACKING
        this.observing = [] // nodes we are looking at. Our value depends on these nodes
        this.newObserving = null // during tracking it's an array with new observed observers
        this.isBeingObserved = false
        this.isPendingUnobservation = false
        this.observers = new Set()
        this.diffValue = 0
        this.runId = 0
        this.lastAccessedBy = 0
        this.lowestObserverState = internal_1.IDerivationState.UP_TO_DATE
        this.unboundDepsCount = 0
        this.__mapid = "#" + internal_1.getNextId()
        this.value = new internal_1.CaughtException(null)
        this.isComputing = false // to check for cycles
        this.isRunningSetter = false
        this.isTracing = internal_1.TraceMode.NONE
        if (process.env.NODE_ENV !== "production" && !options.get)
            throw "[mobx] missing option for computed: get"
        this.derivation = options.get
        this.name = options.name || "ComputedValue@" + internal_1.getNextId()
        if (options.set) this.setter = internal_1.createAction(this.name + "-setter", options.set)
        this.equals =
            options.equals ||
            (options.compareStructural || options.struct
                ? internal_1.comparer.structural
                : internal_1.comparer.default)
        this.scope = options.context
        this.requiresReaction = !!options.requiresReaction
        this.keepAlive = !!options.keepAlive
    }
    onBecomeStale() {
        internal_1.propagateMaybeChanged(this)
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
     * Returns the current value of this computed value.
     * Will evaluate its computation first if needed.
     */
    get() {
        if (this.isComputing)
            internal_1.fail(`Cycle detected in computation ${this.name}: ${this.derivation}`)
        if (internal_1.globalState.inBatch === 0 && this.observers.size === 0 && !this.keepAlive) {
            if (internal_1.shouldCompute(this)) {
                this.warnAboutUntrackedRead()
                internal_1.startBatch() // See perf test 'computed memoization'
                this.value = this.computeValue(false)
                internal_1.endBatch()
            }
        } else {
            internal_1.reportObserved(this)
            if (internal_1.shouldCompute(this))
                if (this.trackAndCompute()) internal_1.propagateChangeConfirmed(this)
        }
        const result = this.value
        if (internal_1.isCaughtException(result)) throw result.cause
        return result
    }
    peek() {
        const res = this.computeValue(false)
        if (internal_1.isCaughtException(res)) throw res.cause
        return res
    }
    set(value) {
        if (this.setter) {
            internal_1.invariant(
                !this.isRunningSetter,
                `The setter of computed value '${
                    this.name
                }' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?`
            )
            this.isRunningSetter = true
            try {
                this.setter.call(this.scope, value)
            } finally {
                this.isRunningSetter = false
            }
        } else
            internal_1.invariant(
                false,
                process.env.NODE_ENV !== "production" &&
                    `[ComputedValue '${
                        this.name
                    }'] It is not possible to assign a new value to a computed value.`
            )
    }
    trackAndCompute() {
        if (internal_1.isSpyEnabled() && process.env.NODE_ENV !== "production") {
            internal_1.spyReport({
                object: this.scope,
                type: "compute",
                name: this.name
            })
        }
        const oldValue = this.value
        const wasSuspended =
            /* see #1208 */ this.dependenciesState === internal_1.IDerivationState.NOT_TRACKING
        const newValue = this.computeValue(true)
        const changed =
            wasSuspended ||
            internal_1.isCaughtException(oldValue) ||
            internal_1.isCaughtException(newValue) ||
            !this.equals(oldValue, newValue)
        if (changed) {
            this.value = newValue
        }
        return changed
    }
    computeValue(track) {
        this.isComputing = true
        internal_1.globalState.computationDepth++
        let res
        if (track) {
            res = internal_1.trackDerivedFunction(this, this.derivation, this.scope)
        } else {
            if (internal_1.globalState.disableErrorBoundaries === true) {
                res = this.derivation.call(this.scope)
            } else {
                try {
                    res = this.derivation.call(this.scope)
                } catch (e) {
                    res = new internal_1.CaughtException(e)
                }
            }
        }
        internal_1.globalState.computationDepth--
        this.isComputing = false
        return res
    }
    suspend() {
        if (!this.keepAlive) {
            internal_1.clearObserving(this)
            this.value = undefined // don't hold on to computed value!
        }
    }
    observe(listener, fireImmediately) {
        let firstTime = true
        let prevValue = undefined
        return internal_1.autorun(() => {
            let newValue = this.get()
            if (!firstTime || fireImmediately) {
                const prevU = internal_1.untrackedStart()
                listener({
                    type: "update",
                    object: this,
                    newValue,
                    oldValue: prevValue
                })
                internal_1.untrackedEnd(prevU)
            }
            firstTime = false
            prevValue = newValue
        })
    }
    warnAboutUntrackedRead() {
        if (process.env.NODE_ENV === "production") return
        if (this.requiresReaction === true) {
            internal_1.fail(`[mobx] Computed value ${this.name} is read outside a reactive context`)
        }
        if (this.isTracing !== internal_1.TraceMode.NONE) {
            console.log(
                `[mobx.trace] '${
                    this.name
                }' is being read outside a reactive context. Doing a full recompute`
            )
        }
        if (internal_1.globalState.computedRequiresReaction) {
            console.warn(
                `[mobx] Computed value ${
                    this.name
                } is being read outside a reactive context. Doing a full recompute`
            )
        }
    }
    toJSON() {
        return this.get()
    }
    toString() {
        return `${this.name}[${this.derivation.toString()}]`
    }
    valueOf() {
        return internal_1.toPrimitive(this.get())
    }
    [Symbol.toPrimitive]() {
        return this.valueOf()
    }
}
exports.ComputedValue = ComputedValue
exports.isComputedValue = internal_1.createInstanceofPredicate("ComputedValue", ComputedValue)
