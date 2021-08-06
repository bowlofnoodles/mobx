"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function isSpyEnabled() {
    return process.env.NODE_ENV !== "production" && !!internal_1.globalState.spyListeners.length
}
exports.isSpyEnabled = isSpyEnabled
function spyReport(event) {
    if (process.env.NODE_ENV === "production") return // dead code elimination can do the rest
    if (!internal_1.globalState.spyListeners.length) return
    const listeners = internal_1.globalState.spyListeners
    for (let i = 0, l = listeners.length; i < l; i++) listeners[i](event)
}
exports.spyReport = spyReport
function spyReportStart(event) {
    if (process.env.NODE_ENV === "production") return
    const change = Object.assign({}, event, { spyReportStart: true })
    spyReport(change)
}
exports.spyReportStart = spyReportStart
const END_EVENT = { spyReportEnd: true }
function spyReportEnd(change) {
    if (process.env.NODE_ENV === "production") return
    if (change) spyReport(Object.assign({}, change, { spyReportEnd: true }))
    else spyReport(END_EVENT)
}
exports.spyReportEnd = spyReportEnd
function spy(listener) {
    if (process.env.NODE_ENV === "production") {
        console.warn(`[mobx.spy] Is a no-op in production builds`)
        return function() {}
    } else {
        internal_1.globalState.spyListeners.push(listener)
        return internal_1.once(() => {
            internal_1.globalState.spyListeners = internal_1.globalState.spyListeners.filter(
                l => l !== listener
            )
        })
    }
}
exports.spy = spy
