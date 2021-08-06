"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function hasInterceptors(interceptable) {
    return interceptable.interceptors !== undefined && interceptable.interceptors.length > 0
}
exports.hasInterceptors = hasInterceptors
function registerInterceptor(interceptable, handler) {
    const interceptors = interceptable.interceptors || (interceptable.interceptors = [])
    interceptors.push(handler)
    return internal_1.once(() => {
        const idx = interceptors.indexOf(handler)
        if (idx !== -1) interceptors.splice(idx, 1)
    })
}
exports.registerInterceptor = registerInterceptor
function interceptChange(interceptable, change) {
    const prevU = internal_1.untrackedStart()
    try {
        const interceptors = interceptable.interceptors
        if (interceptors)
            for (let i = 0, l = interceptors.length; i < l; i++) {
                change = interceptors[i](change)
                internal_1.invariant(
                    !change || change.type,
                    "Intercept handlers should return nothing or a change object"
                )
                if (!change) break
            }
        return change
    } finally {
        internal_1.untrackedEnd(prevU)
    }
}
exports.interceptChange = interceptChange
