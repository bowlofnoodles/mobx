"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
/**
 * Creates a named reactive view and keeps it alive, so that the view is always
 * updated if one of the dependencies changes, even when the view is not further used by something else.
 * @param view The reactive view
 * @returns disposer function, which can be used to stop the view from being updated in the future.
 */
function autorun(view, opts = internal_1.EMPTY_OBJECT) {
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            typeof view === "function",
            "Autorun expects a function as first argument"
        )
        internal_1.invariant(
            internal_1.isAction(view) === false,
            "Autorun does not accept actions since actions are untrackable"
        )
    }
    const name = (opts && opts.name) || view.name || "Autorun@" + internal_1.getNextId()
    const runSync = !opts.scheduler && !opts.delay
    let reaction
    if (runSync) {
        // normal autorun
        // 初始化Reaction，第二个参数会再初始化后调用schedule的调用栈中被调用
        reaction = new internal_1.Reaction(
            name,
            function() {
                this.track(reactionRunner)
            },
            opts.onError
        )
    } else {
        const scheduler = createSchedulerFromOptions(opts)
        // debounced autorun
        let isScheduled = false
        reaction = new internal_1.Reaction(
            name,
            () => {
                if (!isScheduled) {
                    isScheduled = true
                    scheduler(() => {
                        isScheduled = false
                        if (!reaction.isDisposed) reaction.track(reactionRunner)
                    })
                }
            },
            opts.onError
        )
    }
    function reactionRunner() {
        view(reaction)
    }
    // 主动调用schedule方法
    reaction.schedule()
    // 返回可以dispose reaction的一个函数
    return reaction.getDisposer()
}
exports.autorun = autorun
const run = f => f()
function createSchedulerFromOptions(opts) {
    return opts.scheduler ? opts.scheduler : opts.delay ? f => setTimeout(f, opts.delay) : run
}
function reaction(expression, effect, opts = internal_1.EMPTY_OBJECT) {
    if (process.env.NODE_ENV !== "production") {
        internal_1.invariant(
            typeof expression === "function",
            "First argument to reaction should be a function"
        )
        internal_1.invariant(
            typeof opts === "object",
            "Third argument of reactions should be an object"
        )
    }
    const name = opts.name || "Reaction@" + internal_1.getNextId()
    const effectAction = internal_1.action(
        name,
        opts.onError ? wrapErrorHandler(opts.onError, effect) : effect
    )
    const runSync = !opts.scheduler && !opts.delay
    const scheduler = createSchedulerFromOptions(opts)
    let firstTime = true
    let isScheduled = false
    let value
    // 自定义比对equals的方法
    const equals = opts.compareStructural
        ? internal_1.comparer.structural
        : opts.equals || internal_1.comparer.default
    const r = new internal_1.Reaction(
        name,
        () => {
            if (firstTime || runSync) {
                reactionRunner()
            } else if (!isScheduled) {
                isScheduled = true
                scheduler(reactionRunner)
            }
        },
        opts.onError
    )
    // 与autorun不同其实就在这个函数上 其它都一样
    // 最后触发更新也是拿出expression和effectAction(effect经action包裹)来执行，而autorun是拿view
    function reactionRunner() {
        isScheduled = false // Q: move into reaction runner?
        if (r.isDisposed) return
        let changed = false
        // reaction 主动调一个track方法 去收集expression的依赖
        r.track(() => {
            const nextValue = expression(r)
            changed = firstTime || !equals(value, nextValue)
            value = nextValue
        })
        // 第一次调度 且 选项是立即触发 触发一次
        if (firstTime && opts.fireImmediately) effectAction(value, r)
        // 不是第一次 且 值改变了 触发一次
        if (!firstTime && changed === true) effectAction(value, r)
        // 第一次 则 改掉标识firstTime为false
        if (firstTime) firstTime = false
    }
    r.schedule()
    return r.getDisposer()
}
exports.reaction = reaction
function wrapErrorHandler(errorHandler, baseFn) {
    return function() {
        try {
            return baseFn.apply(this, arguments)
        } catch (e) {
            errorHandler.call(this, e)
        }
    }
}
