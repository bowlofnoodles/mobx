"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
var IDerivationState
;(function(IDerivationState) {
    // before being run or (outside batch and not being observed)
    // at this point derivation is not holding any data about dependency tree
    IDerivationState[(IDerivationState["NOT_TRACKING"] = -1)] = "NOT_TRACKING"
    // no shallow dependency changed since last computation
    // won't recalculate derivation
    // this is what makes mobx fast
    IDerivationState[(IDerivationState["UP_TO_DATE"] = 0)] = "UP_TO_DATE"
    // some deep dependency changed, but don't know if shallow dependency changed
    // will require to check first if UP_TO_DATE or POSSIBLY_STALE
    // currently only ComputedValue will propagate POSSIBLY_STALE
    //
    // having this state is second big optimization:
    // don't have to recompute on every dependency change, but only when it's needed
    IDerivationState[(IDerivationState["POSSIBLY_STALE"] = 1)] = "POSSIBLY_STALE"
    // A shallow dependency has changed since last computation and the derivation
    // will need to recompute when it's needed next.
    IDerivationState[(IDerivationState["STALE"] = 2)] = "STALE"
})((IDerivationState = exports.IDerivationState || (exports.IDerivationState = {})))
var TraceMode
;(function(TraceMode) {
    TraceMode[(TraceMode["NONE"] = 0)] = "NONE"
    TraceMode[(TraceMode["LOG"] = 1)] = "LOG"
    TraceMode[(TraceMode["BREAK"] = 2)] = "BREAK"
})((TraceMode = exports.TraceMode || (exports.TraceMode = {})))
class CaughtException {
    constructor(cause) {
        this.cause = cause
        // Empty
    }
}
exports.CaughtException = CaughtException
function isCaughtException(e) {
    return e instanceof CaughtException
}
exports.isCaughtException = isCaughtException
/**
 * Finds out whether any dependency of the derivation has actually changed.
 * If dependenciesState is 1 then it will recalculate dependencies,
 * if any dependency changed it will propagate it by changing dependenciesState to 2.
 *
 * By iterating over the dependencies in the same order that they were reported and
 * stopping on the first change, all the recalculations are only called for ComputedValues
 * that will be tracked by derivation. That is because we assume that if the first x
 * dependencies of the derivation doesn't change then the derivation should run the same way
 * up until accessing x-th dependency.
 */
function shouldCompute(derivation) {
    // 根据dependenciesState状态返回是否需要计算
    switch (derivation.dependenciesState) {
        case IDerivationState.UP_TO_DATE:
            return false
        case IDerivationState.NOT_TRACKING:
        case IDerivationState.STALE:
            return true
        case IDerivationState.POSSIBLY_STALE: {
            const prevUntracked = untrackedStart() // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
            const obs = derivation.observing,
                l = obs.length
            for (let i = 0; i < l; i++) {
                const obj = obs[i]
                if (internal_1.isComputedValue(obj)) {
                    if (internal_1.globalState.disableErrorBoundaries) {
                        obj.get()
                    } else {
                        try {
                            obj.get()
                        } catch (e) {
                            // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                            untrackedEnd(prevUntracked)
                            return true
                        }
                    }
                    // if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
                    // and `derivation` is an observer of `obj`
                    // invariantShouldCompute(derivation)
                    if (derivation.dependenciesState === IDerivationState.STALE) {
                        untrackedEnd(prevUntracked)
                        return true
                    }
                }
            }
            changeDependenciesStateTo0(derivation)
            untrackedEnd(prevUntracked)
            return false
        }
    }
}
exports.shouldCompute = shouldCompute
// function invariantShouldCompute(derivation: IDerivation) {
//     const newDepState = (derivation as any).dependenciesState
//     if (
//         process.env.NODE_ENV === "production" &&
//         (newDepState === IDerivationState.POSSIBLY_STALE ||
//             newDepState === IDerivationState.NOT_TRACKING)
//     )
//         fail("Illegal dependency state")
// }
function isComputingDerivation() {
    return internal_1.globalState.trackingDerivation !== null // filter out actions inside computations
}
exports.isComputingDerivation = isComputingDerivation
function checkIfStateModificationsAreAllowed(atom) {
    const hasObservers = atom.observers.size > 0
    // Should never be possible to change an observed observable from inside computed, see #798
    if (internal_1.globalState.computationDepth > 0 && hasObservers)
        internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                `Computed values are not allowed to cause side effects by changing observables that are already being observed. Tried to modify: ${
                    atom.name
                }`
        )
    // Should not be possible to change observed state outside strict mode, except during initialization, see #563
    if (
        !internal_1.globalState.allowStateChanges &&
        (hasObservers || internal_1.globalState.enforceActions === "strict")
    )
        internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                (internal_1.globalState.enforceActions
                    ? "Since strict-mode is enabled, changing observed observable values outside actions is not allowed. Please wrap the code in an `action` if this change is intended. Tried to modify: "
                    : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, the render function of a React component? Tried to modify: ") +
                    atom.name
        )
}
exports.checkIfStateModificationsAreAllowed = checkIfStateModificationsAreAllowed
/**
 * Executes the provided function `f` and tracks which observables are being accessed.
 * The tracking information is stored on the `derivation` object and the derivation is registered
 * as observer of any of the accessed observables.
 */
// 入参 derivation 是Reaction对象，f为reaction效果函数即监听执行的函数 context为f调用的执行上下文，this指向的问题用于call调用传入
function trackDerivedFunction(derivation, f, context) {
    // pre allocate array allocation + room for variation in deps
    // array will be trimmed by bindDependencies
    // 先调用 changeDependenciesStateTo0 方法将 derivation 和 observing 置为稳定态 UP_TO_DATE，主要是方便后续判断是否处在收集依赖阶段
    changeDependenciesStateTo0(derivation)
    // 提前为observing申请空间 为一个数组，这里为什么是100的原因，就跟core/reactioin.js中的MAX_REACTION_ITERATIONS赋值为100有关系了。
    derivation.newObserving = new Array(derivation.observing.length + 100)
    // unboundDepsCount记录尚未绑定的数量，observable被观察者被访问时，触发get，通过reportObserved()收集依赖然后更新值
    derivation.unboundDepsCount = 0
    derivation.runId = ++internal_1.globalState.runId
    // 暂存上一个上下文
    const prevTracking = internal_1.globalState.trackingDerivation
    // 然后将当前reaction的上下文赋值给全局
    internal_1.globalState.trackingDerivation = derivation
    let result
    // 可以通过全局变量globalState.disableErrorBoundaries设置是否要mobx处理错误边界
    if (internal_1.globalState.disableErrorBoundaries === true) {
        result = f.call(context)
    }
    // 执行函数
    else {
        try {
            // 这里就真正的执行了autorun传进来的参数，虽然是mobx用reactionRunner包裹了一层
            /*
            function reactionRunner() {
                view(reaction) // view就是外面传进来的函数
            }
            */
            // 前提：如果执行getter的时候，mobx的observable操作还没经initialInstance赋值一些adm等东西就会先进入初始化，然后才进入后面的adm的拦截
            // 这里执行的时候，如果访问到observable的值，就会触发对应的getter(observablevalue.js)，然后reportObserved，reportObserved是ObservableValue的函数
            // 结束后，会把可观察ObservableValue放到newObserving中。**注意：这里还没有真正的放到observings**
            result = f.call(context)
        } catch (e) {
            // 统一处理错误
            result = new CaughtException(e)
        }
    }
    // 执行完 回退为上一次derivation
    internal_1.globalState.trackingDerivation = prevTracking
    // Reaction跟Observable建立关系，这一步才真正的在处理observing和被观察者的observer了
    bindDependencies(derivation)
    return result
}
exports.trackDerivedFunction = trackDerivedFunction
/**
 * diffs newObserving with observing.
 * update observing to be newObserving with unique observables
 * notify observers that become observed/unobserved
 */
// 这个函数 就是根据derivation上现在的observing和newObserving，然后做比对去重然后新增。
// 另外对observing即被观察者挂载上观察者即当前的derivation(又是反向挂载)，操作observers属性，
function bindDependencies(derivation) {
    // 暂存旧的observable列表
    const prevObserving = derivation.observing
    // 赋值新的 初始化是空数组
    const observing = (derivation.observing = derivation.newObserving)
    let lowestNewObservingDerivationState = IDerivationState.UP_TO_DATE
    // Go through all new observables and check diffValue: (this list can contain duplicates):
    //   0: first occurrence, change to 1 and keep it
    //   1: extra occurrence, drop it
    // 遍历所有新的observable，去除重复的observable
    let i0 = 0,
        l = derivation.unboundDepsCount
    for (let i = 0; i < l; i++) {
        // 这里实际上用了双指针方法去重，i0为慢指针，i为快指针
        const dep = observing[i]
        // 跳过重复的值，即diffValue 等于 1的值；当跳过重复的值时i与i0就不相等了，i领先于i0
        if (dep.diffValue === 0) {
            dep.diffValue = 1
            if (i0 !== i) observing[i0] = dep
            i0++
        }
        // Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
        // not hitting the condition
        if (dep.dependenciesState > lowestNewObservingDerivationState) {
            lowestNewObservingDerivationState = dep.dependenciesState
        }
    }
    observing.length = i0
    // 置空
    derivation.newObserving = null // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)
    // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
    //   0: it's not in new observables, unobserve it
    //   1: it keeps being observed, don't want to notify it. change to 0
    l = prevObserving.length
    while (l--) {
        const dep = prevObserving[l]
        if (dep.diffValue === 0) {
            internal_1.removeObserver(dep, derivation)
        }
        dep.diffValue = 0
    }
    // Go through all new observables and check diffValue: (now it should be unique)
    //   0: it was set to 0 in last loop. don't need to do anything.
    //   1: it wasn't observed, let's observe it. set back to 0
    while (i0--) {
        const dep = observing[i0]
        if (dep.diffValue === 1) {
            dep.diffValue = 0
            internal_1.addObserver(dep, derivation)
        }
    }
    // Some new observed derivations may become stale during this derivation computation
    // so they have had no chance to propagate staleness (#916)
    if (lowestNewObservingDerivationState !== IDerivationState.UP_TO_DATE) {
        derivation.dependenciesState = lowestNewObservingDerivationState
        derivation.onBecomeStale()
    }
}
function clearObserving(derivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
    const obs = derivation.observing
    derivation.observing = []
    let i = obs.length
    while (i--) internal_1.removeObserver(obs[i], derivation)
    derivation.dependenciesState = IDerivationState.NOT_TRACKING
}
exports.clearObserving = clearObserving
function untracked(action) {
    const prev = untrackedStart()
    try {
        return action()
    } finally {
        untrackedEnd(prev)
    }
}
exports.untracked = untracked
function untrackedStart() {
    const prev = internal_1.globalState.trackingDerivation
    internal_1.globalState.trackingDerivation = null
    return prev
}
exports.untrackedStart = untrackedStart
function untrackedEnd(prev) {
    internal_1.globalState.trackingDerivation = prev
}
exports.untrackedEnd = untrackedEnd
/**
 * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
 *
 */
function changeDependenciesStateTo0(derivation) {
    // 将观察者的dependenciesState 和 可观察者的lowestObserverState 全部改为UP_TO_DATE 即 0
    if (derivation.dependenciesState === IDerivationState.UP_TO_DATE) return
    derivation.dependenciesState = IDerivationState.UP_TO_DATE
    const obs = derivation.observing
    let i = obs.length
    while (i--) obs[i].lowestObserverState = IDerivationState.UP_TO_DATE
}
exports.changeDependenciesStateTo0 = changeDependenciesStateTo0
