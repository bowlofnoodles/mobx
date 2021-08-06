"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function hasListeners(listenable) {
    return listenable.changeListeners !== undefined && listenable.changeListeners.length > 0
}
exports.hasListeners = hasListeners
function registerListener(listenable, handler) {
    const listeners = listenable.changeListeners || (listenable.changeListeners = [])
    listeners.push(handler)
    return internal_1.once(() => {
        const idx = listeners.indexOf(handler)
        if (idx !== -1) listeners.splice(idx, 1)
    })
}
exports.registerListener = registerListener
function notifyListeners(listenable, change) {
    const prevU = internal_1.untrackedStart()
    let listeners = listenable.changeListeners
    if (!listeners) return
    listeners = listeners.slice()
    for (let i = 0, l = listeners.length; i < l; i++) {
        listeners[i](change)
    }
    internal_1.untrackedEnd(prevU)
}
exports.notifyListeners = notifyListeners
