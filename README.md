# LiveStore Node.js Adapter Bug Reproduction

## 🚨 Issue Summary

**`makeSchema()` doesn't register events in `eventsDefsMap` in Node.js environment**, making server-side clients unusable.

- **Affected Version**: LiveStore v0.3.1
- **Platform**: Node.js (adapter-node)
- **Severity**: Critical - prevents all server-side LiveStore usage

## 🔬 Expected vs Actual Behavior

### Expected (based on [official docs](https://docs.livestore.dev/reference/syncing/server-side-clients/))
```javascript
const schema = makeSchema({ events, state })
console.log(schema.eventsDefsMap) 
// Should contain: { "v1.TestEvent": [EventDefinition] }
```

### Actual (Bug)
```javascript
const schema = makeSchema({ events, state })
console.log(schema.eventsDefsMap) 
// Returns: {} (empty object)
```

## 🔄 Reproduction Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the test:**
   ```bash
   npm test
   ```

3. **Observe the bug:**
   - Events are defined correctly ✅
   - `makeSchema()` runs without error ✅
   - `eventsDefsMap` is empty ❌
   - This causes `store.subscribe()` and `store.commit()` to fail ❌

## 📊 Expected Output

The test should show:
```
❌ BUG CONFIRMED: eventsDefsMap is empty!

This causes the following errors when creating a store:
  - store.subscribe("v1.TestEvent", callback) throws: "Cannot read properties of undefined (reading 'super')"
  - store.commit("v1.TestEvent", data) throws: "No mutation definition found"
```

## 💥 Impact

This bug makes **all Node.js server-side clients unusable**:
- Cannot subscribe to events
- Cannot commit events  
- Cannot use LiveStore for server-side processing
- Prevents implementation of official [server-side client pattern](https://docs.livestore.dev/reference/syncing/server-side-clients/)

## 🔧 Environment

- **LiveStore**: v0.3.1
- **Node.js**: v24.1.0+ (but likely affects all versions)
- **Package Manager**: npm/pnpm/yarn
- **OS**: macOS/Linux/Windows

## 📋 Notes

- Web adapter (`@livestore/adapter-web`) works perfectly ✅
- Bug is specific to Node.js adapter (`@livestore/adapter-node`) ❌
- Schema definition follows official documentation exactly
- Sync server and web clients are unaffected

This is a minimal reproduction case that isolates the exact issue for easier debugging. 