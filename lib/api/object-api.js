"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const internal_1 = require("../internal")
function keys(obj) {
    if (internal_1.isObservableObject(obj)) {
        return obj[internal_1.$mobx].getKeys()
    }
    if (internal_1.isObservableMap(obj)) {
        return Array.from(obj.keys())
    }
    if (internal_1.isObservableSet(obj)) {
        return Array.from(obj.keys())
    }
    if (internal_1.isObservableArray(obj)) {
        return obj.map((_, index) => index)
    }
    return internal_1.fail(
        process.env.NODE_ENV !== "production" &&
            "'keys()' can only be used on observable objects, arrays, sets and maps"
    )
}
exports.keys = keys
function values(obj) {
    if (internal_1.isObservableObject(obj)) {
        return keys(obj).map(key => obj[key])
    }
    if (internal_1.isObservableMap(obj)) {
        return keys(obj).map(key => obj.get(key))
    }
    if (internal_1.isObservableSet(obj)) {
        return Array.from(obj.values())
    }
    if (internal_1.isObservableArray(obj)) {
        return obj.slice()
    }
    return internal_1.fail(
        process.env.NODE_ENV !== "production" &&
            "'values()' can only be used on observable objects, arrays, sets and maps"
    )
}
exports.values = values
function entries(obj) {
    if (internal_1.isObservableObject(obj)) {
        return keys(obj).map(key => [key, obj[key]])
    }
    if (internal_1.isObservableMap(obj)) {
        return keys(obj).map(key => [key, obj.get(key)])
    }
    if (internal_1.isObservableSet(obj)) {
        return Array.from(obj.entries())
    }
    if (internal_1.isObservableArray(obj)) {
        return obj.map((key, index) => [index, key])
    }
    return internal_1.fail(
        process.env.NODE_ENV !== "production" &&
            "'entries()' can only be used on observable objects, arrays and maps"
    )
}
exports.entries = entries
function set(obj, key, value) {
    if (arguments.length === 2 && !internal_1.isObservableSet(obj)) {
        internal_1.startBatch()
        const values = key
        try {
            for (let key in values) set(obj, key, values[key])
        } finally {
            internal_1.endBatch()
        }
        return
    }
    if (internal_1.isObservableObject(obj)) {
        const adm = obj[internal_1.$mobx]
        const existingObservable = adm.values.get(key)
        // 如果已经存在就写
        if (existingObservable) {
            adm.write(key, value)
        } else {
            // 不存在就初始化 加进去
            adm.addObservableProp(key, value, adm.defaultEnhancer)
        }
    } else if (internal_1.isObservableMap(obj)) {
        obj.set(key, value)
    } else if (internal_1.isObservableSet(obj)) {
        obj.add(key)
    } else if (internal_1.isObservableArray(obj)) {
        if (typeof key !== "number") key = parseInt(key, 10)
        internal_1.invariant(key >= 0, `Not a valid index: '${key}'`)
        internal_1.startBatch()
        if (key >= obj.length) obj.length = key + 1
        obj[key] = value
        internal_1.endBatch()
    } else {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                "'set()' can only be used on observable objects, arrays and maps"
        )
    }
}
exports.set = set
function remove(obj, key) {
    if (internal_1.isObservableObject(obj)) {
        obj[internal_1.$mobx].remove(key)
    } else if (internal_1.isObservableMap(obj)) {
        obj.delete(key)
    } else if (internal_1.isObservableSet(obj)) {
        obj.delete(key)
    } else if (internal_1.isObservableArray(obj)) {
        if (typeof key !== "number") key = parseInt(key, 10)
        internal_1.invariant(key >= 0, `Not a valid index: '${key}'`)
        obj.splice(key, 1)
    } else {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                "'remove()' can only be used on observable objects, arrays and maps"
        )
    }
}
exports.remove = remove
function has(obj, key) {
    if (internal_1.isObservableObject(obj)) {
        // return keys(obj).indexOf(key) >= 0
        const adm = internal_1.getAdministration(obj)
        return adm.has(key)
    } else if (internal_1.isObservableMap(obj)) {
        return obj.has(key)
    } else if (internal_1.isObservableSet(obj)) {
        return obj.has(key)
    } else if (internal_1.isObservableArray(obj)) {
        return key >= 0 && key < obj.length
    } else {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                "'has()' can only be used on observable objects, arrays and maps"
        )
    }
}
exports.has = has
function get(obj, key) {
    if (!has(obj, key)) return undefined
    if (internal_1.isObservableObject(obj)) {
        return obj[key]
    } else if (internal_1.isObservableMap(obj)) {
        return obj.get(key)
    } else if (internal_1.isObservableArray(obj)) {
        return obj[key]
    } else {
        return internal_1.fail(
            process.env.NODE_ENV !== "production" &&
                "'get()' can only be used on observable objects, arrays and maps"
        )
    }
}
exports.get = get
