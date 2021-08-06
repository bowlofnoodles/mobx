"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function createAction(actionName, fn, ref) {
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(typeof fn === "function", "`action` can only be invoked on functions")
        if (typeof actionName !== "string" || !actionName)
            internal_1.fail(`actions should have valid names, got: '${actionName}'`)
    }
    const res = function() {
        return executeAction(actionName, fn, ref || this, arguments)
    }
    res.isMobxAction = true
    return res
}
exports.createAction = createAction
function executeAction(actionName, fn, scope, args) {
    const runInfo = startAction(actionName, fn, scope, args)
    let shouldSupressReactionError = true
    try {
        const res = fn.apply(scope, args)
        shouldSupressReactionError = false
        return res
    } finally {
        if (shouldSupressReactionError) {
            internal_1.globalState.suppressReactionErrors = shouldSupressReactionError
            endAction(runInfo)
            internal_1.globalState.suppressReactionErrors = false
        } else {
            endAction(runInfo)
        }
    }
}
exports.executeAction = executeAction
function startAction(actionName, fn, scope, args) {
    const notifySpy = internal_1.isSpyEnabled() && !!actionName
    let startTime = 0
    if (notifySpy && process.env.NODE_ENV !== "production") {
        startTime = Date.now()
        const l = (args && args.length) || 0
        const flattendArgs = new Array(l)
        if (l > 0) for (let i = 0; i < l; i++) flattendArgs[i] = args[i]
        internal_1.spyReportStart({
            type: "action",
            name: actionName,
            object: scope,
            arguments: flattendArgs
        })
    }
    const prevDerivation = internal_1.untrackedStart()
    internal_1.startBatch()
    const prevAllowStateChanges = allowStateChangesStart(true)
    return {
        prevDerivation,
        prevAllowStateChanges,
        notifySpy,
        startTime
    }
}
function endAction(runInfo) {
    allowStateChangesEnd(runInfo.prevAllowStateChanges)
    internal_1.endBatch()
    internal_1.untrackedEnd(runInfo.prevDerivation)
    if (runInfo.notifySpy && process.env.NODE_ENV !== "production")
        internal_1.spyReportEnd({ time: Date.now() - runInfo.startTime })
}
function allowStateChanges(allowStateChanges, func) {
    const prev = allowStateChangesStart(allowStateChanges)
    let res
    try {
        res = func()
    } finally {
        allowStateChangesEnd(prev)
    }
    return res
}
exports.allowStateChanges = allowStateChanges
function allowStateChangesStart(allowStateChanges) {
    const prev = internal_1.globalState.allowStateChanges
    internal_1.globalState.allowStateChanges = allowStateChanges
    return prev
}
exports.allowStateChangesStart = allowStateChangesStart
function allowStateChangesEnd(prev) {
    internal_1.globalState.allowStateChanges = prev
}
exports.allowStateChangesEnd = allowStateChangesEnd
function allowStateChangesInsideComputed(func) {
    const prev = internal_1.globalState.computationDepth
    internal_1.globalState.computationDepth = 0
    let res
    try {
        res = func()
    } finally {
        internal_1.globalState.computationDepth = prev
    }
    return res
}
exports.allowStateChangesInsideComputed = allowStateChangesInsideComputed
