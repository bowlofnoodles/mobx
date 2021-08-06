"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function observe(thing, propOrCb, cbOrFire, fireImmediately) {
    if (typeof cbOrFire === "function")
        return observeObservableProperty(thing, propOrCb, cbOrFire, fireImmediately)
    else return observeObservable(thing, propOrCb, cbOrFire)
}
exports.observe = observe
function observeObservable(thing, listener, fireImmediately) {
    return internal_1.getAdministration(thing).observe(listener, fireImmediately)
}
function observeObservableProperty(thing, property, listener, fireImmediately) {
    return internal_1.getAdministration(thing, property).observe(listener, fireImmediately)
}
