"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
exports.mobxDidRunLazyInitializersSymbol = Symbol("mobx did run lazy initializers")
exports.mobxPendingDecorators = Symbol("mobx pending decorators")
const enumerableDescriptorCache = {}
const nonEnumerableDescriptorCache = {}
function createPropertyInitializerDescriptor(prop, enumerable) {
    const cache = enumerable ? enumerableDescriptorCache : nonEnumerableDescriptorCache
    return (
        cache[prop] ||
        (cache[prop] = {
            configurable: true,
            enumerable: enumerable,
            get() {
                // 初始化的时候拦截执行一次
                console.log("logloggetget")
                initializeInstance(this)
                return this[prop]
            },
            set(value) {
                initializeInstance(this)
                this[prop] = value
            }
        })
    )
}
function initializeInstance(target) {
    // 已经调用过初始化过了 就直接返回
    if (target[exports.mobxDidRunLazyInitializersSymbol] === true) return
    // 把之前藏在mobxPendingDecorators Symbol上的参数拿出来用
    const decorators = target[exports.mobxPendingDecorators]
    if (decorators) {
        internal_1.addHiddenProp(target, exports.mobxDidRunLazyInitializersSymbol, true)
        for (let key in decorators) {
            const d = decorators[key]
            // 调用propertyCreator参数 完成prop挂载
            d.propertyCreator(target, d.prop, d.descriptor, d.decoratorTarget, d.decoratorArguments)
        }
    }
}
exports.initializeInstance = initializeInstance
// 返回decortaor
function createPropDecorator(propertyInitiallyEnumerable, propertyCreator) {
    return function decoratorFactory() {
        let decoratorArguments
        const decorator = function decorate(
            target,
            prop,
            descriptor,
            applyImmediately
            // This is a special parameter to signal the direct application of a decorator, allow extendObservable to skip the entire type decoration part,
            // as the instance to apply the decorator to equals the target
        ) {
            if (applyImmediately === true) {
                // propertyCreator这里就回去给target挂载key了
                propertyCreator(target, prop, descriptor, target, decoratorArguments)
                // 这里非初始化的时候 会return null也就是交给proxy去拦截了
                // extendobservable 会根据resultDescriptor返回值然后判断是否要挂载key
                return null
            }
            if (process.env.NODE_ENV !== "production" && !quacksLikeADecorator(arguments))
                internal_1.fail(
                    "This function is a decorator, but it wasn't invoked like a decorator"
                )
            if (!Object.prototype.hasOwnProperty.call(target, exports.mobxPendingDecorators)) {
                const inheritedDecorators = target[exports.mobxPendingDecorators]
                internal_1.addHiddenProp(
                    target,
                    exports.mobxPendingDecorators,
                    Object.assign({}, inheritedDecorators)
                )
            }
            target[exports.mobxPendingDecorators][prop] = {
                prop,
                propertyCreator,
                descriptor,
                decoratorTarget: target,
                decoratorArguments
            }
            return createPropertyInitializerDescriptor(prop, propertyInitiallyEnumerable)
        }
        if (quacksLikeADecorator(arguments)) {
            // @decorator
            decoratorArguments = internal_1.EMPTY_ARRAY
            return decorator.apply(null, arguments)
        } else {
            // @decorator(args)
            decoratorArguments = Array.prototype.slice.call(arguments)
            return decorator
        }
    }
}
exports.createPropDecorator = createPropDecorator
function quacksLikeADecorator(args) {
    return (
        ((args.length === 2 || args.length === 3) && typeof args[1] === "string") ||
        (args.length === 4 && args[3] === true)
    )
}
exports.quacksLikeADecorator = quacksLikeADecorator
