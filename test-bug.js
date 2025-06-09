#!/usr/bin/env node

import { makeAdapter } from "@livestore/adapter-node";
import { createStorePromise } from "@livestore/livestore";
import { Events, makeSchema, Schema, State } from "@livestore/livestore";

async function main() {
  console.log("🔍 LiveStore Node.js Adapter Bug Reproduction");
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

  // Step 3: Create schema with makeSchema() - THIS IS WHERE THE BUG OCCURS
  console.log("Step 3: Creating schema with makeSchema()...");
  const schema = makeSchema({
    events,
    state,
  });

  console.log("✅ Schema created");
  console.log("");

  // Step 4: Inspect the schema - BUG EVIDENCE
  console.log("Step 4: Inspecting schema results...");
  console.log("Schema keys:", Object.keys(schema));
  console.log("");

  console.log("🔍 EXPECTED: eventsDefsMap should contain event definitions");
  console.log("📊 ACTUAL RESULTS:");
  console.log("  eventsDefsMap keys:", Object.keys(schema.eventsDefsMap || {}));
  console.log(
    "  eventsDefsMap count:",
    Object.keys(schema.eventsDefsMap || {}).length
  );
  console.log("");

  // Step 5: Demonstrate the bug impact
  console.log("Step 5: Demonstrating bug impact...");

  if (Object.keys(schema.eventsDefsMap || {}).length === 0) {
    console.log("❌ BUG CONFIRMED: eventsDefsMap is empty!");
    console.log("");
    console.log("This causes the following errors when creating a store:");
    console.log(
      '  - store.subscribe("v1.TestEvent", callback) throws: "Cannot read properties of undefined (reading \'super\')"'
    );
    console.log(
      '  - store.commit("v1.TestEvent", data) throws: "No mutation definition found"'
    );
    console.log("");
    console.log("📋 Expected behavior (from official docs):");
    console.log(
      '  - eventsDefsMap should contain: { "v1.TestEvent": [EventDefinition] }'
    );
    console.log(
      "  - store.subscribe() and store.commit() should work normally"
    );
  } else {
    console.log("✅ Schema appears to be working correctly");
  }

  console.log("");

  // Step 6: Attempt to create a store and demonstrate the actual failures
  console.log("Step 6: Creating store and testing subscribe/commit...");
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

    // Test 1: Try to subscribe to an event
    console.log("Test 1: Attempting store.subscribe()...");
    try {
      store.subscribe("v1.TestEvent", (event) => {
        console.log("Event received:", event);
      });
      console.log("✅ Subscribe worked (unexpected - bug may be fixed!)");
    } catch (subscribeError) {
      console.log("❌ SUBSCRIBE FAILED:", subscribeError.message);
      console.log("   Error type:", subscribeError.constructor.name);
      console.log("   This confirms the eventsDefsMap bug impact");
    }

    console.log("");

    // Test 2: Try to commit an event
    console.log("Test 2: Attempting store.commit()...");
    try {
      store.commit("v1.TestEvent", {
        id: "test-123",
        message: "Hello World",
      });
      console.log("✅ Commit worked (unexpected - bug may be fixed!)");
    } catch (commitError) {
      console.log("❌ COMMIT FAILED:", commitError.message.split("\n")[0]);
      console.log("   Error type:", commitError.constructor.name);
      console.log("   This confirms the eventsDefsMap bug impact");
    }

    console.log("");
    console.log(
      "💡 Both failures are directly caused by the empty eventsDefsMap"
    );

    // Close the store to clean up resources
    console.log("");
    console.log("🔄 Closing store...");
    await store.close();
    console.log("✅ Store closed");
  } catch (storeError) {
    console.log("❌ STORE CREATION FAILED:", storeError.message);
    console.log("   This might be another symptom of the same bug");
  }

  console.log("");
  console.log(
    "🔗 Reference: https://docs.livestore.dev/reference/syncing/server-side-clients/"
  );
  console.log("📦 LiveStore version:", "0.3.1");
  console.log("🚀 Node.js version:", process.version);
  console.log("");
  console.log("Full schema structure:");
  console.log(JSON.stringify(schema, null, 2));
  console.log("");
  console.log("🏁 Test completed - exiting...");
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
