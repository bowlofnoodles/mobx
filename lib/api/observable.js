"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
// Predefined bags of create observable options, to avoid allocating temporarily option objects
// in the majority of cases
exports.defaultCreateObservableOptions = {
    deep: true, // 是否深劫持
    name: undefined, // 用来debug的name，不传的mobx会内部自己去调用nextId自己去拼装生成
    defaultDecorator: undefined, // 默认的decorator
    proxy: true // 是否用Proxy对象劫持，如果传false就用Object.defineProperty
}
Object.freeze(exports.defaultCreateObservableOptions)
function assertValidOption(key) {
    if (!/^(deep|name|equals|defaultDecorator|proxy)$/.test(key))
        internal_1.fail(`invalid option for (extend)observable: ${key}`)
}
function asCreateObservableOptions(thing) {
    // 默认情况 基本都是直接用defaultCreateObservableOptions
    // {
    //   deep: true,
    //   name: undefined,
    //   defaultDecorator: undefined,
    //   proxy: true
    // };
    if (thing === null || thing === undefined) return exports.defaultCreateObservableOptions
    // 字符串类型
    if (typeof thing === "string")
        // 把它当作name，deep还是true，proxy也还是true
        return { name: thing, deep: true, proxy: true }
    if (process.env.NODE_ENV !== "production") {
        if (typeof thing !== "object") return internal_1.fail("expected options object")
        Object.keys(thing).forEach(assertValidOption)
    }
    // 否则就返回options，也就代表options可以有四个key可以配置
    return thing
}
exports.asCreateObservableOptions = asCreateObservableOptions
exports.deepDecorator = internal_1.createDecoratorForEnhancer(internal_1.deepEnhancer)
const shallowDecorator = internal_1.createDecoratorForEnhancer(internal_1.shallowEnhancer)
exports.refDecorator = internal_1.createDecoratorForEnhancer(internal_1.referenceEnhancer)
const refStructDecorator = internal_1.createDecoratorForEnhancer(internal_1.refStructEnhancer)
function getEnhancerFromOptions(options) {
    return options.defaultDecorator
        ? options.defaultDecorator.enhancer
        : options.deep === false
        ? internal_1.referenceEnhancer
        : internal_1.deepEnhancer
}
/**
 * Turns an object, array or function into a reactive structure.
 * @param v the value which should become observable.
 */
// observable是个装饰器的时候 v就是对象 arg2就是key arg3就是属性标识符
// observable也可能是个函数直接调用
function createObservable(v, arg2, arg3) {
    // 装饰器的模式
    // @observable someProp;
    if (typeof arguments[1] === "string") {
        return exports.deepDecorator.apply(null, arguments)
    }
    // 已经是劫持的observable 就直接返回
    // it is an observable already, done
    if (internal_1.isObservable(v)) return v
    // 根据不同的入参数据类型，做不同的劫持操作 （对象 数据 map set）
    // something that can be converted and mutated?
    const res = internal_1.isPlainObject(v)
        ? exports.observable.object(v, arg2, arg3)
        : Array.isArray(v)
        ? exports.observable.array(v, arg2)
        : internal_1.isES6Map(v)
        ? exports.observable.map(v, arg2)
        : internal_1.isES6Set(v)
        ? exports.observable.set(v, arg2)
        : v
    // this value could be converted to a new observable data structure, return it
    if (res !== v) return res
    // otherwise, just box it
    internal_1.fail(
        process.env.NODE_ENV !== "production" &&
            `The provided value could not be converted into an observable. If you want just create an observable reference to the object use 'observable.box(value)'`
    )
}
const observableFactories = {
    box(value, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("box")
        const o = asCreateObservableOptions(options)
        return new internal_1.ObservableValue(
            value,
            getEnhancerFromOptions(o),
            o.name,
            true,
            o.equals
        )
    },
    array(initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("array")
        const o = asCreateObservableOptions(options)
        return internal_1.createObservableArray(initialValues, getEnhancerFromOptions(o), o.name)
    },
    map(initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("map")
        const o = asCreateObservableOptions(options)
        return new internal_1.ObservableMap(initialValues, getEnhancerFromOptions(o), o.name)
    },
    set(initialValues, options) {
        if (arguments.length > 2) incorrectlyUsedAsDecorator("set")
        const o = asCreateObservableOptions(options)
        return new internal_1.ObservableSet(initialValues, getEnhancerFromOptions(o), o.name)
    },
    object(props, decorators, options) {
        console.log("hellobowlofnoodles")
        if (typeof arguments[1] === "string") incorrectlyUsedAsDecorator("object")
        /*
          对options的参数处理 默认不传的话就是 {
            deep: true,
            name: undefined,
            defaultDecorator: undefined,
            proxy: true
          }
        */
        const o = asCreateObservableOptions(options)
        // 如果传入proxy为false 则使用Object.definePropert作属性劫持
        if (o.proxy === false) {
            return internal_1.extendObservable({}, props, decorators, o)
        }
        // 默认都是使用Proxy作劫持
        else {
            // 默认deep为true是取到deepDecorator exports.deeDecorator 递归的深劫持的劫持器
            const defaultDecorator = internal_1.getDefaultDecoratorFromObjectOptions(o)
            // 初始化东西
            // 会实例化一个ObservableObjectAdministration类型的adm对象，供后面Proxy劫持使用，定义了一些handle 方法，就是get set等
            // extendObservable中会将adm赋值给属性$mobx（是个Symbol值），以供proxy代理时调用
            const base = internal_1.extendObservable({}, undefined, undefined, o)
            // 真正的基于base生成了proxy对象 handler上都是对adm上的接口调用封装
            const proxy = internal_1.createDynamicObservableObject(base)
            // 将对象的各种属性经过相应的装饰器包裹以后再赋值给对象的代理proxy的属性。// TODO stop处
            internal_1.extendObservableObjectWithProperties(
                proxy,
                props,
                decorators,
                defaultDecorator
            )
            return proxy
        }
    },
    ref: exports.refDecorator,
    shallow: shallowDecorator,
    deep: exports.deepDecorator,
    struct: refStructDecorator
}
exports.observable = createObservable
// weird trick to keep our typings nicely with our funcs, and still extend the observable function
Object.keys(observableFactories).forEach(
    name => (exports.observable[name] = observableFactories[name])
)
function incorrectlyUsedAsDecorator(methodName) {
    internal_1.fail(
        // process.env.NODE_ENV !== "production" &&
        `Expected one or two arguments to observable.${methodName}. Did you accidentally try to use observable.${methodName} as decorator?`
    )
}
