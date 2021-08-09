"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
// 返回decorator decorator本质是个拦截的函数 也就是 (target, key, desc) => {return desc} 这样子类型的
// 其实是createPropDecorator的代理函数
// 将enhancer挂载上去 为了后面用
function createDecoratorForEnhancer(enhancer) {
    internal_1.invariant(enhancer)
    const decorator = internal_1.createPropDecorator(
        true,
        // @observable propertyName
        // 会在initializeInstance被调用 initializeInstance会在初始化空对象还有对象的操作时被调用（即get和set）
        (target, propertyName, descriptor, _decoratorTarget, decoratorArgs) => {
            if (process.env.NODE_ENV !== "production") {
                internal_1.invariant(
                    !descriptor || !descriptor.get,
                    `@observable cannot be used on getter (property "${internal_1.stringifyKey(
                        propertyName
                    )}"), use @computed instead.`
                )
            }
            const initialValue = descriptor
                ? descriptor.initializer
                    ? descriptor.initializer.call(target)
                    : descriptor.value
                : undefined
            internal_1
                .asObservableObject(target)
                .addObservableProp(propertyName, initialValue, enhancer)
        }
    )
    const res =
        // Extra process checks, as this happens during module initialization
        typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production"
            ? function observableDecorator() {
                  // This wrapper function is just to detect illegal decorator invocations, deprecate in a next version
                  // and simply return the created prop decorator
                  if (arguments.length < 2)
                      return internal_1.fail(
                          "Incorrect decorator invocation. @observable decorator doesn't expect any arguments"
                      )
                  return decorator.apply(null, arguments)
              }
            : decorator
    res.enhancer = enhancer
    return res
}
exports.createDecoratorForEnhancer = createDecoratorForEnhancer
