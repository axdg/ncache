export default function ncache(def, limit) {
  const map = new Map()
  const timeouts = new Map()

  function limited() {
    const keys = []

    function splice(key) {
      const index = keys.indexOf(key)
      if (index !== -1) keys.splice(index, 1)
      clearTimeout(timeouts.get(key))
    }

    function reorder(key) {
      const index = keys.indexOf(key)
      if (index !== -1) {
        keys.unshift(keys.splice(index, 1)[0])
        return
      }

      if (keys.length === limit) {
        const k = keys.pop()
        map.delete(k)
        clearTimeout(timeouts.get(k))
      }

      keys.unshift(key)
    }

    function _clear() {
      map.clear()
      timeouts.values().forEach(t => clearTimeout(t))
      timeouts.clear()
      keys.length = 0
    }

    function _del(key) {
      map.delete(key)
      splice(key)
    }

    function _set(key, value, time = def) {
      reorder(key)
      map.set(key)

      if (time) {
        timeouts.set(key, setTimeout(function () {
          splice(key)
          map.delete(key)
        }, time))
      }
    }

    return [
      _clear,
      _del,
      _set,
    ]
  }

  function unlimited() {
    function _clear() {
      map.clear()
      timeouts.values().forEach(t => clearTimeout(t))
    }

    function _del(key) {
      map.delete(key)
      clearTimeout(timeouts.get(key))
      timeouts.delete(key)
    }

    function _set(key, value, time = def) {
      clearTimeout(timeouts.get(key))
      timeouts.delete(key)
      map.set(key, value)

      if (time) {
        timeouts.set(key, setTimeout(function () {
          timeouts.delete(key)
          map.delete(key)
        }, time))
      }
    }

    return [
      _clear,
      _del,
      _set,
    ]
  }

  const [
    clear,
    del,
    set,
  ] = limit ? limited() : unlimited()

  return {
    clear,
    delete: del,
    entries: map.entries,
    forEach: map.forEach,
    get: map.get,
    has: map.has,
    keys: map.keys,
    set,
    values: map.values,
    get size() { return map.size },
  }
}
