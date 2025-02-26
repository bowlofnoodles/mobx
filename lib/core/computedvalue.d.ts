import {
    CaughtException,
    IDerivation,
    IDerivationState,
    IEqualsComparer,
    IObservable,
    IValueDidChange,
    Lambda,
    TraceMode
} from "../internal"
export interface IComputedValue<T> {
    get(): T
    set(value: T): void
    observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda
}
export interface IComputedValueOptions<T> {
    get?: () => T
    set?: (value: T) => void
    name?: string
    equals?: IEqualsComparer<T>
    context?: any
    requiresReaction?: boolean
    keepAlive?: boolean
}
/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */
export declare class ComputedValue<T> implements IObservable, IComputedValue<T>, IDerivation {
    dependenciesState: IDerivationState
    observing: IObservable[]
    newObserving: null
    isBeingObserved: boolean
    isPendingUnobservation: boolean
    observers: Set<any>
    diffValue: number
    runId: number
    lastAccessedBy: number
    lowestObserverState: IDerivationState
    unboundDepsCount: number
    __mapid: string
    protected value: T | undefined | CaughtException
    name: string
    triggeredBy?: string
    isComputing: boolean
    isRunningSetter: boolean
    derivation: () => T
    setter?: (value: T) => void
    isTracing: TraceMode
    scope: Object | undefined
    private equals
    private requiresReaction
    private keepAlive
    /**
     * Create a new computed value based on a function expression.
     *
     * The `name` property is for debug purposes only.
     *
     * The `equals` property specifies the comparer function to use to determine if a newly produced
     * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
     * compares based on identity comparison (===), and `structualComparer` deeply compares the structure.
     * Structural comparison can be convenient if you always produce a new aggregated object and
     * don't want to notify observers if it is structurally the same.
     * This is useful for working with vectors, mouse coordinates etc.
     */
    constructor(options: IComputedValueOptions<T>)
    onBecomeStale(): void
    onBecomeObservedListeners: Set<Lambda> | undefined
    onBecomeUnobservedListeners: Set<Lambda> | undefined
    onBecomeObserved(): void
    onBecomeUnobserved(): void
    /**
     * Returns the current value of this computed value.
     * Will evaluate its computation first if needed.
     */
    get(): T
    peek(): T
    set(value: T): void
    private trackAndCompute
    computeValue(track: boolean): T | CaughtException
    suspend(): void
    observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda
    warnAboutUntrackedRead(): void
    toJSON(): T
    toString(): string
    valueOf(): T
    [Symbol.toPrimitive](): T
}
export declare const isComputedValue: (x: any) => x is ComputedValue<{}>
