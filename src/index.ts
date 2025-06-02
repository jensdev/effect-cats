import { DevTools } from "@effect/experimental";
import { NodeRuntime, NodeSocket } from "@effect/platform-node";
import { Effect, Layer, pipe, Schema, Option } from "effect";
import { Cat, CatId } from "./domain/cats"; // Cat is used for creation
import { Cats, CatsLayer } from "./services/cats";
import { CatsDataLayer } from "./data-access/cats-data";

// Import from Veterinary Bounded Context
import { HealthRecordsService, HealthRecordsServiceLayer } from "./veterinary/services/health-records";
import { HealthRecordsDataLayer } from "./veterinary/data-access/health-records-data";
import { HealthRecordEventType } from "./veterinary/domain/health-record"; // Import EventType

const program = Effect.gen(function* () {
  const catsService = yield* Cats;
  const healthRecordsService = yield* HealthRecordsService;

  // --- Cats Service Demonstration ---
  // Create a new cat
  const newCat = new Cat({
    id: "cat001" as CatId,
    name: "Whiskers",
    age: 3,
    breed: "Bombay"
  });
  yield* catsService.persist(newCat);
  yield* Effect.logInfo(`Cat ${newCat.name} persisted with ID: ${newCat.id}`);

  // Find the cat
  const foundCat = yield* catsService.findById(newCat.id);
  yield* Effect.logInfo("Found cat:", foundCat);

  // --- HealthRecords Service Demonstration ---
  // Add a health record for the cat
  const newHealthRecord = yield* healthRecordsService.addRecord({
    catId: foundCat.id,
    date: new Date(),
    eventType: "Checkup" as HealthRecordEventType, // Make sure this matches one of the literals
    notes: "Annual checkup, all good.",
    veterinarianName: "Dr. Pawson"
  });
  yield* Effect.logInfo("Added health record:", newHealthRecord);

  // Add another health record for the same cat
  const anotherHealthRecord = yield* healthRecordsService.addRecord({
    catId: foundCat.id,
    date: new Date(2023, 10, 15), // Month is 0-indexed
    eventType: "Vaccination" as HealthRecordEventType,
    notes: "Rabies vaccine administered.",
    // veterinarianName is optional, so we can omit it or pass null/undefined
  });
  yield* Effect.logInfo("Added another health record:", anotherHealthRecord);

  // Retrieve all health records for the cat
  const catHealthRecords = yield* healthRecordsService.getRecordsForCat(foundCat.id);
  yield* Effect.logInfo(`Health records for ${foundCat.name}:`, catHealthRecords);

  // --- Demonstrate Error Handling (Optional: find records for a non-existent cat) ---
  const nonExistentCatId = "cat-non-existent" as CatId;
  const recordsForNonExistentCat = yield* Effect.either(
    healthRecordsService.getRecordsForCat(nonExistentCatId)
  );
  if (recordsForNonExistentCat._tag === "Left") {
    yield* Effect.logWarning(`As expected, no records found for ${nonExistentCatId}: ${recordsForNonExistentCat.left._tag}`);
  } else {
    yield* Effect.logError("This should not happen: Found records for a non-existent cat.");
  }

  // --- Demonstrate finding a specific health record ---
  const specificRecord = yield* healthRecordsService.getRecordById(newHealthRecord.recordId);
  yield* Effect.logInfo("Found specific health record by ID:", specificRecord);

  // --- Demonstrate Deleting a health record ---
  yield* healthRecordsService.deleteRecord(anotherHealthRecord.recordId);
  yield* Effect.logInfo(`Deleted health record ID: ${anotherHealthRecord.recordId}`);

  // Try to retrieve the deleted record (should fail)
  const deletedRecordRetrieval = yield* Effect.either(
     healthRecordsService.getRecordById(anotherHealthRecord.recordId)
  );
  if (deletedRecordRetrieval._tag === "Left") {
     yield* Effect.logInfo(`As expected, record ${anotherHealthRecord.recordId} not found after deletion: ${deletedRecordRetrieval.left._tag}`);
  } else {
     yield* Effect.logError("This should not happen: Deleted record was found.");
  }

  // Retrieve all health records for the cat again to see the change
  const updatedCatHealthRecords = yield* healthRecordsService.getRecordsForCat(foundCat.id);
  yield* Effect.logInfo(`Health records for ${foundCat.name} after deletion:`, updatedCatHealthRecords);


});

// Merge all layers: Cats context and Veterinary context
const AppLayer = Layer.mergeAll(
  CatsLayer,
  CatsDataLayer,
  HealthRecordsServiceLayer,
  HealthRecordsDataLayer
);

const runnableProgram = program.pipe(Effect.provide(AppLayer));

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

// Run the program
pipe(runnableProgram, Effect.provide(DevToolsLive), NodeRuntime.runMain);
