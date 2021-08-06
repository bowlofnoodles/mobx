"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
function makeIterable(iterator) {
    iterator[Symbol.iterator] = self
    return iterator
}
exports.makeIterable = makeIterable
function self() {
    return this
}
