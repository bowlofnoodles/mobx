import { $mobx, IEnhancer, IListenable, Lambda, IInterceptable, IInterceptor } from "../internal"
export declare type IObservableSetInitialValues<T> = Set<T> | T[]
export declare type ISetDidChange<T = any> =
    | {
          object: ObservableSet<T>
          type: "add"
          newValue: T
      }
    | {
          object: ObservableSet<T>
          type: "delete"
          oldValue: T
      }
export declare type ISetWillChange<T = any> =
    | {
          type: "delete"
          object: ObservableSet<T>
          oldValue: T
      }
    | {
          type: "add"
          object: ObservableSet<T>
          newValue: T
      }
export declare class ObservableSet<T = any>
    implements Set<T>, IInterceptable<ISetWillChange>, IListenable {
    name: string;
    [$mobx]: {}
    private _data
    private _atom
    changeListeners: any
    interceptors: any
    dehancer: any
    enhancer: (newV: any, oldV: any | undefined) => any
    constructor(
        initialData?: IObservableSetInitialValues<T>,
        enhancer?: IEnhancer<T>,
        name?: string
    )
    private dehanceValue
    clear(): void
    forEach(callbackFn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void
    readonly size: number
    add(value: T): this
    delete(value: any): boolean
    has(value: any): boolean
    entries(): IterableIterator<[T, T]>
    keys(): IterableIterator<T>
    values(): IterableIterator<T>
    replace(other: ObservableSet<T> | IObservableSetInitialValues<T>): ObservableSet<T>
    observe(listener: (changes: ISetDidChange<T>) => void, fireImmediately?: boolean): Lambda
    intercept(handler: IInterceptor<ISetWillChange<T>>): Lambda
    toJS(): Set<T>
    toString(): string
    [Symbol.iterator](): IterableIterator<T>
    [Symbol.toStringTag]: "Set"
}
export declare const isObservableSet: (thing: any) => thing is ObservableSet<any>
