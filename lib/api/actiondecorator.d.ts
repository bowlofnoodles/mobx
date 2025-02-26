import { BabelDescriptor } from "../internal"
declare function dontReassignFields(): void
export declare function namedActionDecorator(
    name: string
): (
    target: any,
    prop: any,
    descriptor: BabelDescriptor
) =>
    | void
    | {
          value: Function & import("../internal").IAction
          enumerable: boolean
          configurable: boolean
          writable: boolean
      }
    | {
          enumerable: boolean
          configurable: boolean
          writable: boolean
          initializer(): Function & import("../internal").IAction
          value?: undefined
      }
export declare function actionFieldDecorator(
    name: string
): (target: any, prop: any, descriptor: any) => void
export declare function boundActionDecorator(
    target: any,
    propertyName: any,
    descriptor: any,
    applyToInstance?: boolean
):
    | {
          configurable: boolean
          enumerable: boolean
          get(): any
          set: typeof dontReassignFields
      }
    | {
          enumerable: boolean
          configurable: boolean
          set(v: any): void
          get(): undefined
      }
    | null
export {}
