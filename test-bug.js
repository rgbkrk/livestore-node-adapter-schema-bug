#!/usr/bin/env node

import { Events, makeSchema, Schema, State } from '@livestore/livestore'

console.log('🔍 LiveStore Node.js Adapter Bug Reproduction')
console.log('==============================================')
console.log('')

// Step 1: Define a minimal event (following official docs pattern)
console.log('Step 1: Defining events...')
const events = {
  testEvent: Events.synced({
    name: 'v1.TestEvent',
    schema: Schema.Struct({ 
      id: Schema.String,
      message: Schema.String
    }),
  }),
}

console.log('✅ Events defined:', Object.keys(events))
console.log('✅ Event function type:', typeof events.testEvent)
console.log('')

// Step 2: Define minimal state
console.log('Step 2: Defining state...')
const tables = {
  testTable: State.SQLite.table({
    name: 'test',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      message: State.SQLite.text(),
    },
  }),
}

const materializers = State.SQLite.materializers(events, {
  'v1.TestEvent': ({ id, message }) => 
    tables.testTable.insert({ id, message }),
})

const state = State.SQLite.makeState({ 
  tables, 
  materializers 
})

console.log('✅ State defined with materializers')
console.log('')

// Step 3: Create schema with makeSchema() - THIS IS WHERE THE BUG OCCURS
console.log('Step 3: Creating schema with makeSchema()...')
const schema = makeSchema({ 
  events, 
  state 
})

console.log('✅ Schema created')
console.log('')

// Step 4: Inspect the schema - BUG EVIDENCE
console.log('Step 4: Inspecting schema results...')
console.log('Schema keys:', Object.keys(schema))
console.log('')

console.log('🔍 EXPECTED: eventsDefsMap should contain event definitions')
console.log('📊 ACTUAL RESULTS:')
console.log('  eventsDefsMap keys:', Object.keys(schema.eventsDefsMap || {}))
console.log('  eventsDefsMap count:', Object.keys(schema.eventsDefsMap || {}).length)
console.log('')

// Step 5: Demonstrate the bug impact
console.log('Step 5: Demonstrating bug impact...')

if (Object.keys(schema.eventsDefsMap || {}).length === 0) {
  console.log('❌ BUG CONFIRMED: eventsDefsMap is empty!')
  console.log('')
  console.log('This causes the following errors when creating a store:')
  console.log('  - store.subscribe("v1.TestEvent", callback) throws: "Cannot read properties of undefined (reading \'super\')"')
  console.log('  - store.commit("v1.TestEvent", data) throws: "No mutation definition found"')
  console.log('')
  console.log('📋 Expected behavior (from official docs):')
  console.log('  - eventsDefsMap should contain: { "v1.TestEvent": [EventDefinition] }')
  console.log('  - store.subscribe() and store.commit() should work normally')
} else {
  console.log('✅ Schema appears to be working correctly')
}

console.log('')
console.log('🔗 Reference: https://docs.livestore.dev/reference/syncing/server-side-clients/')
console.log('📦 LiveStore version:', '0.3.1')
console.log('🚀 Node.js version:', process.version)
console.log('')
console.log('Full schema structure:')
console.log(JSON.stringify(schema, null, 2)) 