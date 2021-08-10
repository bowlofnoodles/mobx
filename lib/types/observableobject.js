"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
class ObservableObjectAdministration {
    // 对象 统一用Map来存
    constructor(target, values = new Map(), name, defaultEnhancer) {
        this.target = target // 还没实例化proxy之前的base对象
        this.values = values // 这个很重要了，这个就是实际的值，例如例子中 {a: ObservableValue}这样形式的Map
        this.name = name // 标识的name
        this.defaultEnhancer = defaultEnhancer // 装饰器相关
        this.keysAtom = new internal_1.Atom(name + ".keys") // 原子操作 主要还是用来辅助mobx中的事务优化的
        // 后续还会挂载一个proxy对象 是反向引用整个proxy值
    }
    read(key) {
        return this.values.get(key).get()
    }
    write(key, newValue) {
        const instance = this.target
        const observable = this.values.get(key)
        if (observable instanceof internal_1.ComputedValue) {
            observable.set(newValue)
            return
        }
        // intercept
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                type: "update",
                object: this.proxy || instance,
                name: key,
                newValue
            })
            if (!change) return
            newValue = change.newValue
        }
        // 心智是一个全新的
        newValue = observable.prepareNewValue(newValue)
        // notify spy & observers
        if (newValue !== internal_1.globalState.UNCHANGED) {
            const notify = internal_1.hasListeners(this)
            const notifySpy = internal_1.isSpyEnabled()
            const change =
                notify || notifySpy
                    ? {
                          type: "update",
                          object: this.proxy || instance,
                          oldValue: observable.value,
                          name: key,
                          newValue
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
            // 然后进行替换
            observable.setNewValue(newValue)
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        }
    }
    has(key) {
        const map = this.pendingKeys || (this.pendingKeys = new Map())
        let entry = map.get(key)
        if (entry) return entry.get()
        else {
            const exists = !!this.values.get(key)
            // Possible optimization: Don't have a separate map for non existing keys,
            // but store them in the values map instead, using a special symbol to denote "not existing"
            entry = new internal_1.ObservableValue(
                exists,
                internal_1.referenceEnhancer,
                `${this.name}.${internal_1.stringifyKey(key)}?`,
                false
            )
            map.set(key, entry)
            return entry.get() // read to subscribe
        }
    }
    // 这里就是实际上的get操作的最深调用层 一直以来传递enhancer参数 也在这步用到 实例化ObservableValue上用到了
    addObservableProp(propName, newValue, enhancer = this.defaultEnhancer) {
        const { target } = this
        internal_1.assertPropertyConfigurable(target, propName)
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                object: this.proxy || target,
                name: propName,
                type: "add",
                newValue
            })
            if (!change) return
            newValue = change.newValue
        }
        // 这里因为enhancer的深层次拦截 所以就会开始进入dfs递归拦截
        const observable = new internal_1.ObservableValue(
            newValue,
            enhancer,
            `${this.name}.${internal_1.stringifyKey(propName)}`,
            false
        )
        // 递归调用完了，propName就是data
        this.values.set(propName, observable)
        newValue = observable.value // observableValue might have changed it
        // 拦截上了后续就通过generateObservablePropConfig(propName) 拦截到对建的访问
        // 例如 class Store { @observablue data = {}} 会对data进行这步操作
        // 这里为什么要 get set呢 因为set会对他进行重新拦截 重新observable并重新赋值
        // 这也是为什么 我们直接 store.data = xxx；他依然是可观察的原因
        console.log("propName", propName)
        Object.defineProperty(target, propName, generateObservablePropConfig(propName))
        this.notifyPropertyAddition(propName, newValue)
    }
    addComputedProp(
        propertyOwner, // where is the property declared?
        propName,
        options
    ) {
        const { target } = this
        options.name = options.name || `${this.name}.${internal_1.stringifyKey(propName)}`
        this.values.set(propName, new internal_1.ComputedValue(options))
        if (propertyOwner === target || internal_1.isPropertyConfigurable(propertyOwner, propName))
            Object.defineProperty(propertyOwner, propName, generateComputedPropConfig(propName))
    }
    remove(key) {
        if (!this.values.has(key)) return
        const { target } = this
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                object: this.proxy || target,
                name: key,
                type: "remove"
            })
            if (!change) return
        }
        try {
            internal_1.startBatch()
            const notify = internal_1.hasListeners(this)
            const notifySpy = internal_1.isSpyEnabled()
            const oldObservable = this.values.get(key)
            const oldValue = oldObservable && oldObservable.get()
            oldObservable && oldObservable.set(undefined)
            // notify key and keyset listeners
            this.keysAtom.reportChanged()
            this.values.delete(key)
            if (this.pendingKeys) {
                const entry = this.pendingKeys.get(key)
                if (entry) entry.set(false)
            }
            // delete the prop
            delete this.target[key]
            const change =
                notify || notifySpy
                    ? {
                          type: "remove",
                          object: this.proxy || target,
                          oldValue: oldValue,
                          name: key
                      }
                    : null
            if (notifySpy && process.env.NODE_ENV !== "production")
                internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
            if (notify) internal_1.notifyListeners(this, change)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        } finally {
            internal_1.endBatch()
        }
    }
    illegalAccess(owner, propName) {
        /**
         * This happens if a property is accessed through the prototype chain, but the property was
         * declared directly as own property on the prototype.
         *
         * E.g.:
         * class A {
         * }
         * extendObservable(A.prototype, { x: 1 })
         *
         * classB extens A {
         * }
         * console.log(new B().x)
         *
         * It is unclear whether the property should be considered 'static' or inherited.
         * Either use `console.log(A.x)`
         * or: decorate(A, { x: observable })
         *
         * When using decorate, the property will always be redeclared as own property on the actual instance
         */
        console.warn(
            `Property '${propName}' of '${owner}' was accessed through the prototype chain. Use 'decorate' instead to declare the prop or access it statically through it's owner`
        )
    }
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe(callback, fireImmediately) {
        process.env.NODE_ENV !== "production" &&
            internal_1.invariant(
                fireImmediately !== true,
                "`observe` doesn't support the fire immediately property for observable objects."
            )
        return internal_1.registerListener(this, callback)
    }
    intercept(handler) {
        return internal_1.registerInterceptor(this, handler)
    }
    notifyPropertyAddition(key, newValue) {
        const notify = internal_1.hasListeners(this)
        const notifySpy = internal_1.isSpyEnabled()
        const change =
            notify || notifySpy
                ? {
                      type: "add",
                      object: this.proxy || this.target,
                      name: key,
                      newValue
                  }
                : null
        if (notifySpy && process.env.NODE_ENV !== "production")
            internal_1.spyReportStart(Object.assign({}, change, { name: this.name, key }))
        if (notify) internal_1.notifyListeners(this, change)
        if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        if (this.pendingKeys) {
            const entry = this.pendingKeys.get(key)
            if (entry) entry.set(true)
        }
        this.keysAtom.reportChanged()
    }
    getKeys() {
        this.keysAtom.reportObserved()
        // return Reflect.ownKeys(this.values) as any
        const res = []
        for (const [key, value] of this.values)
            if (value instanceof internal_1.ObservableValue) res.push(key)
        return res
    }
}
exports.ObservableObjectAdministration = ObservableObjectAdministration
// 初始化并且挂载adm对象 并返回adm对象
function asObservableObject(target, name = "", defaultEnhancer = internal_1.deepEnhancer) {
    // 初始化后 对象操作时 这时已经就有adm对象了 就直接返回
    if (Object.prototype.hasOwnProperty.call(target, internal_1.$mobx))
        return target[internal_1.$mobx]
    process.env.NODE_ENV !== "production" &&
        internal_1.invariant(
            Object.isExtensible(target),
            "Cannot make the designated object observable; it is not extensible"
        )
    // 没有就做初始化
    if (!internal_1.isPlainObject(target))
        name = (target.constructor.name || "ObservableObject") + "@" + internal_1.getNextId()
    if (!name) name = "ObservableObject@" + internal_1.getNextId()
    const adm = new ObservableObjectAdministration(
        target,
        new Map(),
        internal_1.stringifyKey(name),
        defaultEnhancer
    )
    // 让$mobx属性不可枚举
    internal_1.addHiddenProp(target, internal_1.$mobx, adm)
    return adm
}
exports.asObservableObject = asObservableObject
const observablePropertyConfigs = Object.create(null)
const computedPropertyConfigs = Object.create(null)
function generateObservablePropConfig(propName) {
    return (
        observablePropertyConfigs[propName] ||
        (observablePropertyConfigs[propName] = {
            configurable: true,
            enumerable: true,
            // 读写都是再操作adm对象
            get() {
                return this[internal_1.$mobx].read(propName)
            },
            // 读写都是再操作adm对象
            set(v) {
                this[internal_1.$mobx].write(propName, v)
            }
        })
    )
}
exports.generateObservablePropConfig = generateObservablePropConfig
function getAdministrationForComputedPropOwner(owner) {
    const adm = owner[internal_1.$mobx]
    if (!adm) {
        // because computed props are declared on proty,
        // the current instance might not have been initialized yet
        internal_1.initializeInstance(owner)
        return owner[internal_1.$mobx]
    }
    return adm
}
function generateComputedPropConfig(propName) {
    return (
        computedPropertyConfigs[propName] ||
        (computedPropertyConfigs[propName] = {
            configurable: internal_1.globalState.computedConfigurable,
            enumerable: false,
            get() {
                return getAdministrationForComputedPropOwner(this).read(propName)
            },
            set(v) {
                getAdministrationForComputedPropOwner(this).write(propName, v)
            }
        })
    )
}
exports.generateComputedPropConfig = generateComputedPropConfig
const isObservableObjectAdministration = internal_1.createInstanceofPredicate(
    "ObservableObjectAdministration",
    ObservableObjectAdministration
)
function isObservableObject(thing) {
    if (internal_1.isObject(thing)) {
        // Initializers run lazily when transpiling to babel, so make sure they are run...
        internal_1.initializeInstance(thing)
        return isObservableObjectAdministration(thing[internal_1.$mobx])
    }
    return false
}
exports.isObservableObject = isObservableObject
