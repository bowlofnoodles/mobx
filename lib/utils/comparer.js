"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function identityComparer(a, b) {
    return a === b
}
function structuralComparer(a, b) {
    return internal_1.deepEqual(a, b)
}
function defaultComparer(a, b) {
    return Object.is(a, b)
}
exports.comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    default: defaultComparer
}
