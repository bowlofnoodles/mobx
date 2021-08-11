"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
class ObservableValue extends internal_1.Atom {
    constructor(
        value,
        enhancer,
        name = "ObservableValue@" + internal_1.getNextId(),
        notifySpy = true,
        // 可以自定义equals comparer.default
        equals = internal_1.comparer.default
    ) {
        super(name)
        this.enhancer = enhancer
        this.name = name
        this.equals = equals
        this.hasUnreportedChange = false
        // 这里真的的调用了enhancer 会根据value的类型去调用createObservable做深层次的拦截 也就是递归了 就是一个Proxy值
        this.value = enhancer(value, undefined, name)
        if (notifySpy && internal_1.isSpyEnabled() && process.env.NODE_ENV !== "production") {
            // only notify spy if this is a stand-alone observable
            internal_1.spyReport({ type: "create", name: this.name, newValue: "" + this.value })
        }
    }
    dehanceValue(value) {
        if (this.dehancer !== undefined) return this.dehancer(value)
        return value
    }
    set(newValue) {
        // 例如 class Store { @observablue data = {}} 会对data进行这步操作
        // 当我们 我们直接 store.data = xxx；他依然是可观察的原因
        // 是因为这里重新拦截然后做了新的值的enhancer处理 再重新赋值了
        const oldValue = this.value
        newValue = this.prepareNewValue(newValue)
        if (newValue !== internal_1.globalState.UNCHANGED) {
            const notifySpy = internal_1.isSpyEnabled()
            if (notifySpy && process.env.NODE_ENV !== "production") {
                internal_1.spyReportStart({
                    type: "update",
                    name: this.name,
                    newValue,
                    oldValue
                })
            }
            // 设置新值 并且触发reaction(调用reportChanged)
            this.setNewValue(newValue)
            if (notifySpy && process.env.NODE_ENV !== "production") internal_1.spyReportEnd()
        }
    }
    prepareNewValue(newValue) {
        internal_1.checkIfStateModificationsAreAllowed(this)
        if (internal_1.hasInterceptors(this)) {
            const change = internal_1.interceptChange(this, {
                object: this,
                type: "update",
                newValue
            })
            if (!change) return internal_1.globalState.UNCHANGED
            newValue = change.newValue
        }
        // apply modifier
        // 生成一个全新的
        newValue = this.enhancer(newValue, this.value, this.name)
        // 这里会做新值和旧值的对比，如果没改变会返回一个UNCHANGED的常量
        // 这个equals 默认是mobx导出的comparer.default(内部是调用的Object.is 浅比较 复杂类型是比对引用 去比较)，可以自定义
        return this.equals(this.value, newValue) ? internal_1.globalState.UNCHANGED : newValue
    }
    setNewValue(newValue) {
        // 改值并且调用reportChanged触发改变到reaction去
        const oldValue = this.value
        this.value = newValue
        this.reportChanged()
        if (internal_1.hasListeners(this)) {
            internal_1.notifyListeners(this, {
                type: "update",
                object: this,
                newValue,
                oldValue
            })
        }
    }
    get() {
        // 拦截 上报观察者
        this.reportObserved()
        // 返回值
        return this.dehanceValue(this.value)
    }
    intercept(handler) {
        return internal_1.registerInterceptor(this, handler)
    }
    observe(listener, fireImmediately) {
        if (fireImmediately)
            listener({
                object: this,
                type: "update",
                newValue: this.value,
                oldValue: undefined
            })
        return internal_1.registerListener(this, listener)
    }
    toJSON() {
        return this.get()
    }
    toString() {
        return `${this.name}[${this.value}]`
    }
    valueOf() {
        return internal_1.toPrimitive(this.get())
    }
    [Symbol.toPrimitive]() {
        return this.valueOf()
    }
}
exports.ObservableValue = ObservableValue
exports.isObservableValue = internal_1.createInstanceofPredicate("ObservableValue", ObservableValue)
