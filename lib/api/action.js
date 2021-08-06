"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
exports.action = function action(arg1, arg2, arg3, arg4) {
    // action(fn() {})
    if (arguments.length === 1 && typeof arg1 === "function")
        return internal_1.createAction(arg1.name || "<unnamed action>", arg1)
    // action("name", fn() {})
    if (arguments.length === 2 && typeof arg2 === "function")
        return internal_1.createAction(arg1, arg2)
    // @action("name") fn() {}
    if (arguments.length === 1 && typeof arg1 === "string")
        return internal_1.namedActionDecorator(arg1)
    // @action fn() {}
    if (arg4 === true) {
        // apply to instance immediately
        internal_1.addHiddenProp(
            arg1,
            arg2,
            internal_1.createAction(arg1.name || arg2, arg3.value, this)
        )
    } else {
        return internal_1.namedActionDecorator(arg2).apply(null, arguments)
    }
}
exports.action.bound = internal_1.boundActionDecorator
function runInAction(arg1, arg2) {
    const actionName = typeof arg1 === "string" ? arg1 : arg1.name || "<unnamed action>"
    const fn = typeof arg1 === "function" ? arg1 : arg2
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            typeof fn === "function" && fn.length === 0,
            "`runInAction` expects a function without arguments"
        )
        if (typeof actionName !== "string" || !actionName)
            internal_1.fail(`actions should have valid names, got: '${actionName}'`)
    }
    return internal_1.executeAction(actionName, fn, this, undefined)
}
exports.runInAction = runInAction
function isAction(thing) {
    return typeof thing === "function" && thing.isMobxAction === true
}
exports.isAction = isAction
function defineBoundAction(target, propertyName, fn) {
    internal_1.addHiddenProp(
        target,
        propertyName,
        internal_1.createAction(propertyName, fn.bind(target))
    )
}
exports.defineBoundAction = defineBoundAction
