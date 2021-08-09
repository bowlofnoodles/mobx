"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
// {} undefined undefined o
function extendObservable(target, properties, decorators, options) {
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            arguments.length >= 2 && arguments.length <= 4,
            "'extendObservable' expected 2-4 arguments"
        )
        internal_1.invariant(
            typeof target === "object",
            "'extendObservable' expects an object as first argument"
        )
        internal_1.invariant(
            !internal_1.isObservableMap(target),
            "'extendObservable' should not be used on maps, use map.merge instead"
        )
    }
    options = internal_1.asCreateObservableOptions(options)
    const defaultDecorator = getDefaultDecoratorFromObjectOptions(options)
    internal_1.initializeInstance(target) // Fixes #1740
    internal_1.asObservableObject(target, options.name, defaultDecorator.enhancer) // make sure object is observable, even without initial props
    if (properties)
        extendObservableObjectWithProperties(target, properties, decorators, defaultDecorator)
    return target
}
exports.extendObservable = extendObservable
function getDefaultDecoratorFromObjectOptions(options) {
    return (
        options.defaultDecorator ||
        (options.deep === false ? internal_1.refDecorator : internal_1.deepDecorator)
    )
}
exports.getDefaultDecoratorFromObjectOptions = getDefaultDecoratorFromObjectOptions
function extendObservableObjectWithProperties(target, properties, decorators, defaultDecorator) {
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            !internal_1.isObservable(properties),
            "Extending an object with another observable (object) is not supported. Please construct an explicit propertymap, using `toJS` if need. See issue #540"
        )
        if (decorators) {
            const keys = internal_1.getPlainObjectKeys(decorators)
            for (const key of keys) {
                if (!(key in properties))
                    internal_1.fail(
                        `Trying to declare a decorator for unspecified property '${internal_1.stringifyKey(
                            key
                        )}'`
                    )
            }
        }
    }
    internal_1.startBatch()
    try {
        // 获取可枚举的key普通值 和 key Symbol值（这里也就说明了一点，mobx不会追踪劫持不可枚举即enumrable为false的key）
        const keys = internal_1.getPlainObjectKeys(properties)
        for (const key of keys) {
            const descriptor = Object.getOwnPropertyDescriptor(properties, key)
            if (process.env.NODE_ENV !== "production") {
                if (Object.getOwnPropertyDescriptor(target, key))
                    internal_1.fail(
                        `'extendObservable' can only be used to introduce new properties. Use 'set' or 'decorate' instead. The property '${internal_1.stringifyKey(
                            key
                        )}' already exists on '${target}'`
                    )
                if (internal_1.isComputed(descriptor.value))
                    internal_1.fail(
                        `Passing a 'computed' as initial property value is no longer supported by extendObservable. Use a getter or decorator instead`
                    )
            }
            // 根据入参类型 计算最终取的decorator到底是哪个
            const decorator =
                decorators && key in decorators
                    ? decorators[key]
                    : descriptor.get
                    ? internal_1.computedDecorator
                    : defaultDecorator
            if (process.env.NODE_ENV !== "production" && typeof decorator !== "function")
                internal_1.fail(
                    `Not a valid decorator for '${internal_1.stringifyKey(key)}', got: ${decorator}`
                )
            // 这里的第四个参数 true就是 utils/decorators createPropDecorator最终返回的decorator的第四个参数 立即调用生成
            const resultDescriptor = decorator(target, key, descriptor, true)
            if (
                resultDescriptor // otherwise, assume already applied, due to `applyToInstance`
            ) {
                // 挂载上去对象
                Object.defineProperty(target, key, resultDescriptor)
            }
        }
    } finally {
        internal_1.endBatch()
    }
}
exports.extendObservableObjectWithProperties = extendObservableObjectWithProperties
