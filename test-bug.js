#!/usr/bin/env node

import { makeAdapter } from "@livestore/adapter-node";
import { createStorePromise, queryDb } from "@livestore/livestore";
import { Events, makeSchema, Schema, State } from "@livestore/livestore";

async function main() {
  console.log("🔍 LiveStore Node.js Adapter - Fixed API Usage");
  console.log("==============================================");
  console.log("");

  // Step 1: Define a minimal event (following official docs pattern)
  console.log("Step 1: Defining events...");
  const events = {
    testEvent: Events.synced({
      name: "v1.TestEvent",
      schema: Schema.Struct({
        id: Schema.String,
        message: Schema.String,
      }),
    }),
  };

  console.log("✅ Events defined:", Object.keys(events));
  console.log("✅ Event function type:", typeof events.testEvent);
  console.log("");

  // Step 2: Define minimal state
  console.log("Step 2: Defining state...");
  const tables = {
    testTable: State.SQLite.table({
      name: "test",
      columns: {
        id: State.SQLite.text({ primaryKey: true }),
        message: State.SQLite.text(),
      },
    }),
  };

  const materializers = State.SQLite.materializers(events, {
    "v1.TestEvent": ({ id, message }) =>
      tables.testTable.insert({ id, message }),
  });

  const state = State.SQLite.makeState({
    tables,
    materializers,
  });

  console.log("✅ State defined with materializers");
  console.log("");

  // Step 3: Create schema with makeSchema()
  console.log("Step 3: Creating schema with makeSchema()...");
  const schema = makeSchema({
    events,
    state,
  });

  console.log("✅ Schema created");
  console.log("");

  // Step 4: Inspect the schema correctly - FIX for original bug report
  console.log("Step 4: Inspecting schema results (CORRECTED)...");
  console.log("Schema keys:", Object.keys(schema));
  console.log("");

  console.log("🔍 CORRECTED: Using proper Map inspection methods");
  console.log("📊 ACTUAL RESULTS:");
  console.log("  eventsDefsMap size:", schema.eventsDefsMap.size);
  console.log("  eventsDefsMap keys:", Array.from(schema.eventsDefsMap.keys()));
  console.log("");

  // Step 5: Show the fix worked
  console.log("Step 5: Verifying eventsDefsMap is properly populated...");

  if (schema.eventsDefsMap.size > 0) {
    console.log("✅ CORRECTED: eventsDefsMap is properly populated!");
    console.log("   The original bug report was due to incorrect Map inspection");
    console.log("   (Used Object.keys() on a Map instead of .size and Array.from(.keys()))");
  } else {
    console.log("❌ eventsDefsMap is still empty - this would be a real bug");
  }

  console.log("");

  // Step 6: Create a store and demonstrate CORRECT API usage
  console.log("Step 6: Creating store and testing CORRECT subscribe/commit...");
  console.log("");

  // Add timeout to prevent hanging
  const timeoutMs = 5000;
  console.log(`⏱️  Setting ${timeoutMs}ms timeout to prevent hanging...`);

  const testWithTimeout = async () => {
    // Create adapter and store (without sync to avoid hanging)
    const adapter = makeAdapter({
      storage: { type: "in-memory" },
      // No sync backend - we just want to test local store operations
    });

    const store = await createStorePromise({
      adapter,
      schema,
      storeId: "test-bug-repro",
      // No syncPayload - this should work for local-only testing
    });

    return store;
  };

  try {
    const store = await Promise.race([
      testWithTimeout(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Store creation timed out")),
          timeoutMs
        )
      ),
    ]);

    console.log("✅ Store created successfully");
    console.log("");

    // CORRECTED Test 1: Create a query object and subscribe to it
    console.log("Test 1: Attempting store.subscribe() with CORRECT API...");
    try {
      // ✅ CORRECT: Create a query object first
      const testQuery$ = queryDb(tables.testTable.where({}));
      
      // ✅ CORRECT: Subscribe to the query object, not a string
      store.subscribe(testQuery$, {
        onUpdate: (results) => {
          console.log("Query results updated:", results);
        },
      });
      console.log("✅ Subscribe worked with correct API!");
      console.log("   Used queryDb() to create query object");
      console.log("   Subscribed to query object, not event string");
    } catch (subscribeError) {
      console.log("❌ SUBSCRIBE FAILED:", subscribeError.message);
      console.log("   Error type:", subscribeError.constructor.name);
      console.log("   This would indicate a different issue");
    }

    console.log("");

    // CORRECTED Test 2: Commit using event function
    console.log("Test 2: Attempting store.commit() with CORRECT API...");
    try {
      // ✅ CORRECT: Use the event function, not a string
      store.commit(events.testEvent({
        id: "test-123",
        message: "Hello World",
      }));
      console.log("✅ Commit worked with correct API!");
      console.log("   Used events.testEvent(data) instead of string");
    } catch (commitError) {
      console.log("❌ COMMIT FAILED:", commitError.message.split("\n")[0]);
      console.log("   Error type:", commitError.constructor.name);
      console.log("   This would indicate a different issue");
    }

    console.log("");
    console.log("💡 Key fixes applied:");
    console.log("   1. Added queryDb import");
    console.log("   2. Created query object with queryDb(tables.testTable.where({}))");
    console.log("   3. Subscribe to query object, not event string");
    console.log("   4. Commit with events.testEvent(data), not string");

    // Store cleanup (LiveStore handles cleanup automatically)
    console.log("");
    console.log("✅ Store operations completed successfully");
  } catch (storeError) {
    console.log("❌ STORE CREATION FAILED:", storeError.message);
    console.log("   This might indicate a different issue");
  }

  console.log("");
  console.log("📚 Key Learnings:");
  console.log("   • Events are for committing: store.commit(events.eventName(data))");
  console.log("   • Queries are for subscribing: store.subscribe(queryDb(...), options)");
  console.log("   • eventsDefsMap is a Map, not an object - use .size and Array.from(.keys())");
  console.log("");
  console.log("🔗 Reference: https://docs.livestore.dev/reference/syncing/server-side-clients/");
  console.log("📦 LiveStore version:", "0.3.1");
  console.log("🚀 Node.js version:", process.version);
  console.log("");
  console.log("🏁 Test completed with CORRECT API usage - exiting...");
}

// Run the test and handle any unhandled errors
main()
  .catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  })
  .finally(() => {
    // Force exit to prevent hanging
    process.exit(0);
  });
