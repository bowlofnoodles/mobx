"use strict"
/**
 * (c) Michel Weststrate 2015 - 2018
 * MIT Licensed
 *
 * Welcome to the mobx sources! To get an global overview of how MobX internally works,
 * this is a good place to start:
 * https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
 *
 * Source folders:
 * ===============
 *
 * - api/     Most of the public static methods exposed by the module can be found here.
 * - core/    Implementation of the MobX algorithm; atoms, derivations, reactions, dependency trees, optimizations. Cool stuff can be found here.
 * - types/   All the magic that is need to have observable objects, arrays and values is in this folder. Including the modifiers like `asFlat`.
 * - utils/   Utility stuff.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true })
if (typeof Proxy === "undefined" || typeof Symbol === "undefined") {
    throw new Error(
        "[mobx] MobX 5+ requires Proxy and Symbol objects. If your environment doesn't support Symbol or Proxy objects, please downgrade to MobX 4. For React Native Android, consider upgrading JSCore."
    )
}
try {
    // define process.env if needed
    // if this is not a production build in the first place
    // (in which case the expression below would be substituted with 'production')
    process.env.NODE_ENV
} catch (e) {
    const g = typeof window !== "undefined" ? window : global
    if (typeof process === "undefined") g.process = {}
    g.process.env = {}
}
;(() => {
    function testCodeMinification() {}
    if (
        testCodeMinification.name !== "testCodeMinification" &&
        process.env.NODE_ENV !== "production" &&
        process.env.IGNORE_MOBX_MINIFY_WARNING !== "true"
    ) {
        // trick so it doesn't get replaced
        const varName = ["process", "env", "NODE_ENV"].join(".")
        console.warn(
            `[mobx] you are running a minified build, but '${varName}' was not set to 'production' in your bundler. This results in an unnecessarily large and slow bundle`
        )
    }
})()
var internal_1 = require("./internal")
exports.Reaction = internal_1.Reaction
exports.untracked = internal_1.untracked
exports.IDerivationState = internal_1.IDerivationState
exports.createAtom = internal_1.createAtom
exports.spy = internal_1.spy
exports.comparer = internal_1.comparer
exports.isObservableObject = internal_1.isObservableObject
exports.isBoxedObservable = internal_1.isObservableValue
exports.isObservableArray = internal_1.isObservableArray
exports.ObservableMap = internal_1.ObservableMap
exports.isObservableMap = internal_1.isObservableMap
exports.ObservableSet = internal_1.ObservableSet
exports.isObservableSet = internal_1.isObservableSet
exports.transaction = internal_1.transaction
exports.observable = internal_1.observable
exports.computed = internal_1.computed
exports.isObservable = internal_1.isObservable
exports.isObservableProp = internal_1.isObservableProp
exports.isComputed = internal_1.isComputed
exports.isComputedProp = internal_1.isComputedProp
exports.extendObservable = internal_1.extendObservable
exports.observe = internal_1.observe
exports.intercept = internal_1.intercept
exports.autorun = internal_1.autorun
exports.reaction = internal_1.reaction
exports.when = internal_1.when
exports.action = internal_1.action
exports.isAction = internal_1.isAction
exports.runInAction = internal_1.runInAction
exports.keys = internal_1.keys
exports.values = internal_1.values
exports.entries = internal_1.entries
exports.set = internal_1.set
exports.remove = internal_1.remove
exports.has = internal_1.has
exports.get = internal_1.get
exports.decorate = internal_1.decorate
exports.configure = internal_1.configure
exports.onBecomeObserved = internal_1.onBecomeObserved
exports.onBecomeUnobserved = internal_1.onBecomeUnobserved
exports.flow = internal_1.flow
exports.toJS = internal_1.toJS
exports.trace = internal_1.trace
exports.getDependencyTree = internal_1.getDependencyTree
exports.getObserverTree = internal_1.getObserverTree
exports._resetGlobalState = internal_1.resetGlobalState
exports._getGlobalState = internal_1.getGlobalState
exports.getDebugName = internal_1.getDebugName
exports.getAtom = internal_1.getAtom
exports._getAdministration = internal_1.getAdministration
exports._allowStateChanges = internal_1.allowStateChanges
exports._allowStateChangesInsideComputed = internal_1.allowStateChangesInsideComputed
exports.isArrayLike = internal_1.isArrayLike
exports.$mobx = internal_1.$mobx
exports._isComputingDerivation = internal_1.isComputingDerivation
exports.onReactionError = internal_1.onReactionError
exports._interceptReads = internal_1.interceptReads
// Devtools support
const internal_2 = require("./internal")
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
    // See: https://github.com/andykog/mobx-devtools/
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
        spy: internal_2.spy,
        extras: {
            getDebugName: internal_2.getDebugName
        },
        $mobx: internal_2.$mobx
    })
}
