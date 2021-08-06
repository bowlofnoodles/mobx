"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function dontReassignFields() {
    internal_1.fail(process.env.NODE_ENV !== "production" && "@action fields are not reassignable")
}
function namedActionDecorator(name) {
    return function(target, prop, descriptor) {
        if (descriptor) {
            if (process.env.NODE_ENV !== "production" && descriptor.get !== undefined) {
                return internal_1.fail("@action cannot be used with getters")
            }
            // babel / typescript
            // @action method() { }
            if (descriptor.value) {
                // typescript
                return {
                    value: internal_1.createAction(name, descriptor.value),
                    enumerable: false,
                    configurable: true,
                    writable: true // for typescript, this must be writable, otherwise it cannot inherit :/ (see inheritable actions test)
                }
            }
            // babel only: @action method = () => {}
            const { initializer } = descriptor
            return {
                enumerable: false,
                configurable: true,
                writable: true,
                initializer() {
                    // N.B: we can't immediately invoke initializer; this would be wrong
                    return internal_1.createAction(name, initializer.call(this))
                }
            }
        }
        // bound instance methods
        return actionFieldDecorator(name).apply(this, arguments)
    }
}
exports.namedActionDecorator = namedActionDecorator
function actionFieldDecorator(name) {
    // Simple property that writes on first invocation to the current instance
    return function(target, prop, descriptor) {
        Object.defineProperty(target, prop, {
            configurable: true,
            enumerable: false,
            get() {
                return undefined
            },
            set(value) {
                internal_1.addHiddenProp(this, prop, internal_1.action(name, value))
            }
        })
    }
}
exports.actionFieldDecorator = actionFieldDecorator
function boundActionDecorator(target, propertyName, descriptor, applyToInstance) {
    if (applyToInstance === true) {
        internal_1.defineBoundAction(target, propertyName, descriptor.value)
        return null
    }
    if (descriptor) {
        // if (descriptor.value)
        // Typescript / Babel: @action.bound method() { }
        // also: babel @action.bound method = () => {}
        return {
            configurable: true,
            enumerable: false,
            get() {
                internal_1.defineBoundAction(
                    this,
                    propertyName,
                    descriptor.value || descriptor.initializer.call(this)
                )
                return this[propertyName]
            },
            set: dontReassignFields
        }
    }
    // field decorator Typescript @action.bound method = () => {}
    return {
        enumerable: false,
        configurable: true,
        set(v) {
            internal_1.defineBoundAction(this, propertyName, v)
        },
        get() {
            return undefined
        }
    }
}
exports.boundActionDecorator = boundActionDecorator
