"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function getDependencyTree(thing, property) {
    return nodeToDependencyTree(internal_1.getAtom(thing, property))
}
exports.getDependencyTree = getDependencyTree
function nodeToDependencyTree(node) {
    const result = {
        name: node.name
    }
    if (node.observing && node.observing.length > 0)
        result.dependencies = internal_1.unique(node.observing).map(nodeToDependencyTree)
    return result
}
function getObserverTree(thing, property) {
    return nodeToObserverTree(internal_1.getAtom(thing, property))
}
exports.getObserverTree = getObserverTree
function nodeToObserverTree(node) {
    const result = {
        name: node.name
    }
    if (internal_1.hasObservers(node))
        result.observers = Array.from(internal_1.getObservers(node)).map(nodeToObserverTree)
    return result
}
