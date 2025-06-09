# ✅ RESOLVED: LiveStore Node.js API Usage - Learning Repository

## 🎯 **Issue Status: RESOLVED** 
**Root Cause**: API misuse, not a LiveStore bug  
**Resolution**: Proper API usage patterns implemented  
**Date Resolved**: December 2024

## 📚 What This Repository Shows

This repository demonstrates:
1. **❌ Incorrect API usage** that causes confusing errors
2. **✅ Correct API patterns** that work perfectly
3. **🔍 Root cause analysis** of the original confusion

## 🚨 Original Issue (Incorrect Analysis)

> **`makeSchema()` doesn't register events in `eventsDefsMap` in Node.js environment**, making server-side clients unusable.
> 
> - **Affected Version**: LiveStore v0.3.1
> - **Platform**: Node.js (adapter-node)
> - **Severity**: Critical - prevents all server-side LiveStore usage
> 
> ### 🔬 Expected vs Actual Behavior
> 
> #### Expected (based on [official docs](https://docs.livestore.dev/reference/syncing/server-side-clients/))
> ```javascript
> const schema = makeSchema({ events, state })
> console.log(schema.eventsDefsMap) 
> // Should contain: { "v1.TestEvent": [EventDefinition] }
> ```
> 
> #### Actual (Bug)
> ```javascript
> const schema = makeSchema({ events, state })
> console.log(schema.eventsDefsMap) 
> // Returns: {} (empty object)
> ```

## ✅ Resolution: Proper API Usage

The issue was caused by incorrect LiveStore API usage:

### ❌ What Was Wrong
```javascript
// INCORRECT - causes "Cannot read properties of undefined (reading 'super')"
store.subscribe("v1.TestEvent", callback)
store.commit("v1.TestEvent", data)
```

### ✅ Correct Patterns  
```javascript
// CORRECT - proper LiveStore API usage
import { queryDb } from "@livestore/livestore"

// For subscriptions: use queries
const query$ = queryDb(tables.someTable.where({}))
store.subscribe(query$, { onUpdate: callback })

// For commits: use event functions
store.commit(events.someEvent(data))
```

## 🎓 Key Learnings

1. **Events vs Queries**: Different concepts with different API patterns
2. **Map Inspection**: Use `.size` and `Array.from(.keys())` not `Object.keys()`
3. **Error Messages**: Sometimes point to symptoms, not root cause
4. **LiveStore Works**: No bugs in Node.js adapter when used correctly

