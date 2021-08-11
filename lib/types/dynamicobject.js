"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function getAdm(target) {
    return target[internal_1.$mobx]
}
function isPropertyKey(val) {
    return typeof val === "string" || typeof val === "number" || typeof val === "symbol"
}
// Optimization: we don't need the intermediate objects and could have a completely custom administration for DynamicObjects,
// and skip either the internal values map, or the base object with its property descriptors!
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy Proxy劫持方法第二个参数 handler
const objectProxyTraps = {
    // 原始可以劫持13种操作
    // 这里劫持了主要的6种操作 get set has 删除键 ownKeys preventExtensions（提示报错用的）
    // TODO 看adm上的方法 因为这里本质都是在调adm的方法
    has(target, name) {
        if (
            name === internal_1.$mobx ||
            name === "constructor" ||
            name === internal_1.mobxDidRunLazyInitializersSymbol
        )
            return true
        const adm = getAdm(target)
        // MWE: should `in` operator be reactive? If not, below code path will be faster / more memory efficient
        // TODO: check performance stats!
        // if (adm.values.get(name as string)) return true
        if (isPropertyKey(name)) return adm.has(name)
        return name in target
    },
    get(target, name) {
        // 在每个劫持方法中 统一都会跳过mobx自己处理挂在的key 例如 $mobx constructor mobxDidRunLazyInitializersSymbol(一个未来用的Symbol)
        if (
            name === internal_1.$mobx ||
            name === "constructor" ||
            name === internal_1.mobxDidRunLazyInitializersSymbol
        )
            return target[name]
        const adm = getAdm(target)
        const observable = adm.values.get(name)
        if (observable instanceof internal_1.Atom) {
            const result = observable.get()
            if (result === undefined) {
                // This fixes #1796, because deleting a prop that has an
                // undefined value won't retrigger a observer (no visible effect),
                // the autorun wouldn't subscribe to future key changes (see also next comment)
                adm.has(name)
            }
            return result
        }
        // make sure we start listening to future keys
        // note that we only do this here for optimization
        if (isPropertyKey(name)) adm.has(name)
        return target[name]
    },
    set(target, name, value) {
        if (!isPropertyKey(name)) return false
        // 调全局的set api
        internal_1.set(target, name, value)
        return true
    },
    deleteProperty(target, name) {
        if (!isPropertyKey(name)) return false
        const adm = getAdm(target)
        adm.remove(name)
        return true
    },
    ownKeys(target) {
        const adm = getAdm(target)
        adm.keysAtom.reportObserved()
        return Reflect.ownKeys(target)
    },
    preventExtensions(target) {
        // 不可扩展对象 不符合mobx的原理 所以这里报错 返回false
        internal_1.fail(`Dynamic observable objects cannot be frozen`)
        return false
    }
}
function createDynamicObservableObject(base) {
    // 实例化proxy对象 objectProxyTraps本质上还是调用的base上挂在的adm对象的方法
    const proxy = new Proxy(base, objectProxyTraps)
    // 反向挂在 将proxy对象挂载到adm上的proxy key上
    base[internal_1.$mobx].proxy = proxy
    return proxy
}
exports.createDynamicObservableObject = createDynamicObservableObject
