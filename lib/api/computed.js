"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
exports.computedDecorator = internal_1.createPropDecorator(
    false,
    (instance, propertyName, descriptor, decoratorTarget, decoratorArgs) => {
        const { get, set } = descriptor // initialValue is the descriptor for get / set props
        // Optimization: faster on decorator target or instance? Assuming target
        // Optimization: find out if declaring on instance isn't just faster. (also makes the property descriptor simpler). But, more memory usage..
        // Forcing instance now, fixes hot reloadig issues on React Native:
        const options = decoratorArgs[0] || {}
        internal_1
            .asObservableObject(instance)
            .addComputedProp(
                instance,
                propertyName,
                Object.assign({ get, set, context: instance }, options)
            )
    }
)
const computedStructDecorator = exports.computedDecorator({
    equals: internal_1.comparer.structural
})
/**
 * Decorator for class properties: @computed get value() { return expr; }.
 * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
 */
exports.computed = function computed(arg1, arg2, arg3) {
    if (typeof arg2 === "string") {
        // @computed
        return exports.computedDecorator.apply(null, arguments)
    }
    if (arg1 !== null && typeof arg1 === "object" && arguments.length === 1) {
        // @computed({ options })
        return exports.computedDecorator.apply(null, arguments)
    }
    // computed(expr, options?)
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            typeof arg1 === "function",
            "First argument to `computed` should be an expression."
        )
        internal_1.invariant(
            arguments.length < 3,
            "Computed takes one or two arguments if used as function"
        )
    }
    const opts = typeof arg2 === "object" ? arg2 : {}
    opts.get = arg1
    opts.set = typeof arg2 === "function" ? arg2 : opts.set
    opts.name = opts.name || arg1.name || "" /* for generated name */
    return new internal_1.ComputedValue(opts)
}
exports.computed.struct = computedStructDecorator
