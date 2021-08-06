"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
/**
 * During a transaction no views are updated until the end of the transaction.
 * The transaction will be run synchronously nonetheless.
 *
 * @param action a function that updates some reactive state
 * @returns any value that was returned by the 'action' parameter.
 */
function transaction(action, thisArg = undefined) {
    internal_1.startBatch()
    try {
        return action.apply(thisArg)
    } finally {
        internal_1.endBatch()
    }
}
exports.transaction = transaction
