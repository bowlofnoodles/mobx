"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function hasObservers(observable) {
    return observable.observers && observable.observers.size > 0
}
exports.hasObservers = hasObservers
function getObservers(observable) {
    return observable.observers
}
exports.getObservers = getObservers
// function invariantObservers(observable: IObservable) {
//     const list = observable.observers
//     const map = observable.observersIndexes
//     const l = list.length
//     for (let i = 0; i < l; i++) {
//         const id = list[i].__mapid
//         if (i) {
//             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list") // for performance
//         } else {
//             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map.") // for performance
//         }
//     }
//     invariant(
//         list.length === 0 || Object.keys(map).length === list.length - 1,
//         "INTERNAL ERROR there is no junk in map"
//     )
// }
function addObserver(observable, node) {
    // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
    // invariantObservers(observable);
    observable.observers.add(node)
    if (observable.lowestObserverState > node.dependenciesState)
        observable.lowestObserverState = node.dependenciesState
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
}
exports.addObserver = addObserver
function removeObserver(observable, node) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
    // invariantObservers(observable);
    observable.observers.delete(node)
    if (observable.observers.size === 0) {
        // deleting last observer
        queueForUnobservation(observable)
    }
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}
exports.removeObserver = removeObserver
function queueForUnobservation(observable) {
    if (observable.isPendingUnobservation === false) {
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable.isPendingUnobservation = true
        internal_1.globalState.pendingUnobservations.push(observable)
    }
}
exports.queueForUnobservation = queueForUnobservation
/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
function startBatch() {
    internal_1.globalState.inBatch++
}
exports.startBatch = startBatch
function endBatch() {
    if (--internal_1.globalState.inBatch === 0) {
        internal_1.runReactions()
        // the batch is actually about to finish, all unobserving should happen here.
        const list = internal_1.globalState.pendingUnobservations
        for (let i = 0; i < list.length; i++) {
            const observable = list[i]
            observable.isPendingUnobservation = false
            if (observable.observers.size === 0) {
                if (observable.isBeingObserved) {
                    // if this observable had reactive observers, trigger the hooks
                    observable.isBeingObserved = false
                    observable.onBecomeUnobserved()
                }
                if (observable instanceof internal_1.ComputedValue) {
                    // computed values are automatically teared down when the last observer leaves
                    // this process happens recursively, this computed might be the last observabe of another, etc..
                    observable.suspend()
                }
            }
        }
        internal_1.globalState.pendingUnobservations = []
    }
}
exports.endBatch = endBatch
function reportObserved(observable) {
    const derivation = internal_1.globalState.trackingDerivation
    if (derivation !== null) {
        /**
         * Simple optimization, give each derivation run an unique id (runId)
         * Check if last time this observable was accessed the same runId is used
         * if this is the case, the relation is already known
         */
        if (derivation.runId !== observable.lastAccessedBy) {
            observable.lastAccessedBy = derivation.runId
            // Tried storing newObserving, or observing, or both as Set, but performance didn't come close...
            derivation.newObserving[derivation.unboundDepsCount++] = observable
            if (!observable.isBeingObserved) {
                observable.isBeingObserved = true
                observable.onBecomeObserved()
            }
        }
        return true
    } else if (observable.observers.size === 0 && internal_1.globalState.inBatch > 0) {
        queueForUnobservation(observable)
    }
    return false
}
exports.reportObserved = reportObserved
// function invariantLOS(observable: IObservable, msg: string) {
//     // it's expensive so better not run it in produciton. but temporarily helpful for testing
//     const min = getObservers(observable).reduce((a, b) => Math.min(a, b.dependenciesState), 2)
//     if (min >= observable.lowestObserverState) return // <- the only assumption about `lowestObserverState`
//     throw new Error(
//         "lowestObserverState is wrong for " +
//             msg +
//             " because " +
//             min +
//             " < " +
//             observable.lowestObserverState
//     )
// }
/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */
// Called by Atom when its value changes
function propagateChanged(observable) {
    // invariantLOS(observable, "changed start");
    if (observable.lowestObserverState === internal_1.IDerivationState.STALE) return
    observable.lowestObserverState = internal_1.IDerivationState.STALE
    // Ideally we use for..of here, but the downcompiled version is really slow...
    observable.observers.forEach(d => {
        if (d.dependenciesState === internal_1.IDerivationState.UP_TO_DATE) {
            if (d.isTracing !== internal_1.TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale()
        }
        d.dependenciesState = internal_1.IDerivationState.STALE
    })
    // invariantLOS(observable, "changed end");
}
exports.propagateChanged = propagateChanged
// Called by ComputedValue when it recalculate and its value changed
function propagateChangeConfirmed(observable) {
    // invariantLOS(observable, "confirmed start");
    if (observable.lowestObserverState === internal_1.IDerivationState.STALE) return
    observable.lowestObserverState = internal_1.IDerivationState.STALE
    observable.observers.forEach(d => {
        if (d.dependenciesState === internal_1.IDerivationState.POSSIBLY_STALE)
            d.dependenciesState = internal_1.IDerivationState.STALE
        else if (
            d.dependenciesState === internal_1.IDerivationState.UP_TO_DATE // this happens during computing of `d`, just keep lowestObserverState up to date.
        )
            observable.lowestObserverState = internal_1.IDerivationState.UP_TO_DATE
    })
    // invariantLOS(observable, "confirmed end");
}
exports.propagateChangeConfirmed = propagateChangeConfirmed
// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
function propagateMaybeChanged(observable) {
    // invariantLOS(observable, "maybe start");
    if (observable.lowestObserverState !== internal_1.IDerivationState.UP_TO_DATE) return
    observable.lowestObserverState = internal_1.IDerivationState.POSSIBLY_STALE
    observable.observers.forEach(d => {
        if (d.dependenciesState === internal_1.IDerivationState.UP_TO_DATE) {
            d.dependenciesState = internal_1.IDerivationState.POSSIBLY_STALE
            if (d.isTracing !== internal_1.TraceMode.NONE) {
                logTraceInfo(d, observable)
            }
            d.onBecomeStale()
        }
    })
    // invariantLOS(observable, "maybe end");
}
exports.propagateMaybeChanged = propagateMaybeChanged
function logTraceInfo(derivation, observable) {
    console.log(
        `[mobx.trace] '${derivation.name}' is invalidated due to a change in: '${observable.name}'`
    )
    if (derivation.isTracing === internal_1.TraceMode.BREAK) {
        const lines = []
        printDepTree(internal_1.getDependencyTree(derivation), lines, 1)
        // prettier-ignore
        new Function(`debugger;
/*
Tracing '${derivation.name}'

You are entering this break point because derivation '${derivation.name}' is being traced and '${observable.name}' is now forcing it to update.
Just follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update
The stackframe you are looking for is at least ~6-8 stack-frames up.

${derivation instanceof internal_1.ComputedValue ? derivation.derivation.toString().replace(/[*]\//g, "/") : ""}

The dependencies for this derivation are:

${lines.join("\n")}
*/
    `)();
    }
}
function printDepTree(tree, lines, depth) {
    if (lines.length >= 1000) {
        lines.push("(and many more)")
        return
    }
    lines.push(`${new Array(depth).join("\t")}${tree.name}`) // MWE: not the fastest, but the easiest way :)
    if (tree.dependencies) tree.dependencies.forEach(child => printDepTree(child, lines, depth + 1))
}
