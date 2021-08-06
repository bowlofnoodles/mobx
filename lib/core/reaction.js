"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
class Reaction {
    constructor(name = "Reaction@" + internal_1.getNextId(), onInvalidate, errorHandler) {
        this.name = name
        this.onInvalidate = onInvalidate
        this.errorHandler = errorHandler
        this.observing = [] // nodes we are looking at. Our value depends on these nodes
        this.newObserving = []
        this.dependenciesState = internal_1.IDerivationState.NOT_TRACKING
        this.diffValue = 0
        this.runId = 0
        this.unboundDepsCount = 0
        this.__mapid = "#" + internal_1.getNextId()
        this.isDisposed = false
        this._isScheduled = false
        this._isTrackPending = false
        this._isRunning = false
        this.isTracing = internal_1.TraceMode.NONE
    }
    onBecomeStale() {
        this.schedule()
    }
    schedule() {
        if (!this._isScheduled) {
            this._isScheduled = true
            internal_1.globalState.pendingReactions.push(this)
            runReactions()
        }
    }
    isScheduled() {
        return this._isScheduled
    }
    /**
     * internal, use schedule() if you intend to kick off a reaction
     */
    runReaction() {
        if (!this.isDisposed) {
            internal_1.startBatch()
            this._isScheduled = false
            if (internal_1.shouldCompute(this)) {
                this._isTrackPending = true
                try {
                    this.onInvalidate()
                    if (
                        this._isTrackPending &&
                        internal_1.isSpyEnabled() &&
                        process.env.NODE_ENV !== "production"
                    ) {
                        // onInvalidate didn't trigger track right away..
                        internal_1.spyReport({
                            name: this.name,
                            type: "scheduled-reaction"
                        })
                    }
                } catch (e) {
                    this.reportExceptionInDerivation(e)
                }
            }
            internal_1.endBatch()
        }
    }
    track(fn) {
        if (this.isDisposed) {
            return
            // console.warn("Reaction already disposed") // Note: Not a warning / error in mobx 4 either
        }
        internal_1.startBatch()
        const notify = internal_1.isSpyEnabled()
        let startTime
        if (notify && process.env.NODE_ENV !== "production") {
            startTime = Date.now()
            internal_1.spyReportStart({
                name: this.name,
                type: "reaction"
            })
        }
        this._isRunning = true
        const result = internal_1.trackDerivedFunction(this, fn, undefined)
        this._isRunning = false
        this._isTrackPending = false
        if (this.isDisposed) {
            // disposed during last run. Clean up everything that was bound after the dispose call.
            internal_1.clearObserving(this)
        }
        if (internal_1.isCaughtException(result)) this.reportExceptionInDerivation(result.cause)
        if (notify && process.env.NODE_ENV !== "production") {
            internal_1.spyReportEnd({
                time: Date.now() - startTime
            })
        }
        internal_1.endBatch()
    }
    reportExceptionInDerivation(error) {
        if (this.errorHandler) {
            this.errorHandler(error, this)
            return
        }
        if (internal_1.globalState.disableErrorBoundaries) throw error
        const message = `[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '${this}'`
        if (internal_1.globalState.suppressReactionErrors) {
            console.warn(`[mobx] (error in reaction '${this.name}' suppressed, fix error of causing action below)`); // prettier-ignore
        } else {
            console.error(message, error)
            /** If debugging brought you here, please, read the above message :-). Tnx! */
        }
        if (internal_1.isSpyEnabled()) {
            internal_1.spyReport({
                type: "error",
                name: this.name,
                message,
                error: "" + error
            })
        }
        internal_1.globalState.globalReactionErrorHandlers.forEach(f => f(error, this))
    }
    dispose() {
        if (!this.isDisposed) {
            this.isDisposed = true
            if (!this._isRunning) {
                // if disposed while running, clean up later. Maybe not optimal, but rare case
                internal_1.startBatch()
                internal_1.clearObserving(this)
                internal_1.endBatch()
            }
        }
    }
    getDisposer() {
        const r = this.dispose.bind(this)
        r[internal_1.$mobx] = this
        return r
    }
    toString() {
        return `Reaction[${this.name}]`
    }
    trace(enterBreakPoint = false) {
        internal_1.trace(this, enterBreakPoint)
    }
}
exports.Reaction = Reaction
function onReactionError(handler) {
    internal_1.globalState.globalReactionErrorHandlers.push(handler)
    return () => {
        const idx = internal_1.globalState.globalReactionErrorHandlers.indexOf(handler)
        if (idx >= 0) internal_1.globalState.globalReactionErrorHandlers.splice(idx, 1)
    }
}
exports.onReactionError = onReactionError
/**
 * Magic number alert!
 * Defines within how many times a reaction is allowed to re-trigger itself
 * until it is assumed that this is gonna be a never ending loop...
 */
const MAX_REACTION_ITERATIONS = 100
let reactionScheduler = f => f()
function runReactions() {
    // Trampolining, if runReactions are already running, new reactions will be picked up
    if (internal_1.globalState.inBatch > 0 || internal_1.globalState.isRunningReactions) return
    reactionScheduler(runReactionsHelper)
}
exports.runReactions = runReactions
function runReactionsHelper() {
    internal_1.globalState.isRunningReactions = true
    const allReactions = internal_1.globalState.pendingReactions
    let iterations = 0
    // While running reactions, new reactions might be triggered.
    // Hence we work with two variables and check whether
    // we converge to no remaining reactions after a while.
    while (allReactions.length > 0) {
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error(
                `Reaction doesn't converge to a stable state after ${MAX_REACTION_ITERATIONS} iterations.` +
                    ` Probably there is a cycle in the reactive function: ${allReactions[0]}`
            )
            allReactions.splice(0) // clear reactions
        }
        let remainingReactions = allReactions.splice(0)
        for (let i = 0, l = remainingReactions.length; i < l; i++)
            remainingReactions[i].runReaction()
    }
    internal_1.globalState.isRunningReactions = false
}
exports.isReaction = internal_1.createInstanceofPredicate("Reaction", Reaction)
function setReactionScheduler(fn) {
    const baseScheduler = reactionScheduler
    reactionScheduler = f => fn(() => baseScheduler(f))
}
exports.setReactionScheduler = setReactionScheduler
