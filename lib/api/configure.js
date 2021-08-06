"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function configure(options) {
    const {
        enforceActions,
        computedRequiresReaction,
        computedConfigurable,
        disableErrorBoundaries,
        reactionScheduler
    } = options
    if (options.isolateGlobalState === true) {
        internal_1.isolateGlobalState()
    }
    if (enforceActions !== undefined) {
        if (typeof enforceActions === "boolean" || enforceActions === "strict")
            internal_1.deprecated(
                `Deprecated value for 'enforceActions', use 'false' => '"never"', 'true' => '"observed"', '"strict"' => "'always'" instead`
            )
        let ea
        switch (enforceActions) {
            case true:
            case "observed":
                ea = true
                break
            case false:
            case "never":
                ea = false
                break
            case "strict":
            case "always":
                ea = "strict"
                break
            default:
                internal_1.fail(
                    `Invalid value for 'enforceActions': '${enforceActions}', expected 'never', 'always' or 'observed'`
                )
        }
        internal_1.globalState.enforceActions = ea
        internal_1.globalState.allowStateChanges = ea === true || ea === "strict" ? false : true
    }
    if (computedRequiresReaction !== undefined) {
        internal_1.globalState.computedRequiresReaction = !!computedRequiresReaction
    }
    if (computedConfigurable !== undefined) {
        internal_1.globalState.computedConfigurable = !!computedConfigurable
    }
    if (disableErrorBoundaries !== undefined) {
        if (disableErrorBoundaries === true)
            console.warn(
                "WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled."
            )
        internal_1.globalState.disableErrorBoundaries = !!disableErrorBoundaries
    }
    if (reactionScheduler) {
        internal_1.setReactionScheduler(reactionScheduler)
    }
}
exports.configure = configure
