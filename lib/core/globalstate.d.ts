import { IDerivation, IObservable, Reaction } from "../internal"
export declare type IUNCHANGED = {}
export declare class MobXGlobals {
    /**
     * MobXGlobals version.
     * MobX compatiblity with other versions loaded in memory as long as this version matches.
     * It indicates that the global state still stores similar information
     *
     * N.B: this version is unrelated to the package version of MobX, and is only the version of the
     * internal state storage of MobX, and can be the same across many different package versions
     */
    version: number
    /**
     * globally unique token to signal unchanged
     */
    UNCHANGED: IUNCHANGED
    /**
     * Currently running derivation
     */
    trackingDerivation: IDerivation | null
    /**
     * Are we running a computation currently? (not a reaction)
     */
    computationDepth: number
    /**
     * Each time a derivation is tracked, it is assigned a unique run-id
     */
    runId: number
    /**
     * 'guid' for general purpose. Will be persisted amongst resets.
     */
    mobxGuid: number
    /**
     * Are we in a batch block? (and how many of them)
     */
    inBatch: number
    /**
     * Observables that don't have observers anymore, and are about to be
     * suspended, unless somebody else accesses it in the same batch
     *
     * @type {IObservable[]}
     */
    pendingUnobservations: IObservable[]
    /**
     * List of scheduled, not yet executed, reactions.
     */
    pendingReactions: Reaction[]
    /**
     * Are we currently processing reactions?
     */
    isRunningReactions: boolean
    /**
     * Is it allowed to change observables at this point?
     * In general, MobX doesn't allow that when running computations and React.render.
     * To ensure that those functions stay pure.
     */
    allowStateChanges: boolean
    /**
     * If strict mode is enabled, state changes are by default not allowed
     */
    enforceActions: boolean | "strict"
    /**
     * Spy callbacks
     */
    spyListeners: {
        (change: any): void
    }[]
    /**
     * Globally attached error handlers that react specifically to errors in reactions
     */
    globalReactionErrorHandlers: ((error: any, derivation: IDerivation) => void)[]
    /**
     * Warn if computed values are accessed outside a reactive context
     */
    computedRequiresReaction: boolean
    /**
     * Allows overwriting of computed properties, useful in tests but not prod as it can cause
     * memory leaks. See https://github.com/mobxjs/mobx/issues/1867
     */
    computedConfigurable: boolean
    disableErrorBoundaries: boolean
    suppressReactionErrors: boolean
}
export declare let globalState: MobXGlobals
export declare function isolateGlobalState(): void
export declare function getGlobalState(): any
/**
 * For testing purposes only; this will break the internal state of existing observables,
 * but can be used to get back at a stable state after throwing errors
 */
export declare function resetGlobalState(): void
export declare function getGlobal(): any
