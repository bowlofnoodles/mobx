"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function intercept(thing, propOrHandler, handler) {
    if (typeof handler === "function") return interceptProperty(thing, propOrHandler, handler)
    else return interceptInterceptable(thing, propOrHandler)
}
exports.intercept = intercept
function interceptInterceptable(thing, handler) {
    return internal_1.getAdministration(thing).intercept(handler)
}
function interceptProperty(thing, property, handler) {
    return internal_1.getAdministration(thing, property).intercept(handler)
}
