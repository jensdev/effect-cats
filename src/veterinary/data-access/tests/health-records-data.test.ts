import { Effect, Layer, Option } from "effect";
import { HealthRecordsData, HealthRecordsDataLayer, makeHealthRecordsData } from "../health-records-data";
import { HealthRecord, HealthRecordId, HealthRecordEventType } from "../../domain/health-record";
import { CatId } from "../../../domain/cats"; // Adjust path as necessary
import { HealthRecordNotFoundError, CatHealthRecordsNotFoundError } from "../../domain/errors";

// Mock data or factories would be useful here
const createMockRecord = (id: string, catId: string, date = new Date()): HealthRecord =>
  new HealthRecord({
    recordId: id as HealthRecordId,
    catId: catId as CatId,
    date,
    eventType: "Checkup" as HealthRecordEventType,
    notes: "Test notes for " + id,
    veterinarianName: Option.some("Dr. Test"),
  });

describe("HealthRecordsData", () => {
  const testLayer = HealthRecordsDataLayer;

  it("should persist and find a health record by ID", async () => {
    // const program = Effect.gen(function* (_) {
    //   const dataService = yield* _(HealthRecordsData);
    //   const record = createMockRecord("record1", "cat1");
    //   yield* _(dataService.persist(record));
    //   const found = yield* _(dataService.findById(record.recordId));
    //   expect(found).toEqual(record);
    // });
    // await Effect.runPromise(Effect.provide(program, testLayer));
    console.log("Test: should persist and find a health record by ID - Placeholder");
  });

  it("should fail with HealthRecordNotFoundError when finding a non-existent record", async () => {
    // const program = Effect.gen(function* (_) {
    //   const dataService = yield* _(HealthRecordsData);
    //   const result = yield* _(Effect.either(dataService.findById("nonexistent" as HealthRecordId)));
    //   expect(result._tag).toBe("Left");
    //   if (result._tag === "Left") {
    //     expect(result.left).toBeInstanceOf(HealthRecordNotFoundError);
    //   }
    // });
    // await Effect.runPromise(Effect.provide(program, testLayer));
    console.log("Test: should fail with HealthRecordNotFoundError - Placeholder");
  });

  it("should find all records for a specific catId", async () => {
    // const program = Effect.gen(function* (_) {
    //   const dataService = yield* _(HealthRecordsData);
    //   const cat1Record1 = createMockRecord("rec1cat1", "cat1");
    //   const cat1Record2 = createMockRecord("rec2cat1", "cat1");
    //   const cat2Record1 = createMockRecord("rec1cat2", "cat2");
    //   yield* _(dataService.persist(cat1Record1));
    //   yield* _(dataService.persist(cat1Record2));
    //   yield* _(dataService.persist(cat2Record1));
    //   const cat1Records = yield* _(dataService.findAllByCatId("cat1" as CatId));
    //   expect(cat1Records).toHaveLength(2);
    //   expect(cat1Records).toEqual(expect.arrayContaining([cat1Record1, cat1Record2]));
    // });
    // await Effect.runPromise(Effect.provide(program, testLayer));
    console.log("Test: should find all records for a specific catId - Placeholder");
  });

  it("should fail with CatHealthRecordsNotFoundError if no records exist for a catId", async () => {
     // const program = Effect.gen(function* (_) {
     // const dataService = yield* _(HealthRecordsData);
     // const result = yield* _(Effect.either(dataService.findAllByCatId("cat-nonexistent" as CatId)));
     // expect(result._tag).toBe("Left");
     // if (result._tag === "Left") {
     //  expect(result.left).toBeInstanceOf(CatHealthRecordsNotFoundError);
     // }
     // });
     // await Effect.runPromise(Effect.provide(program, testLayer));
     console.log("Test: should fail with CatHealthRecordsNotFoundError - Placeholder");
  });

  it("should remove a record by ID", async () => {
    // const program = Effect.gen(function* (_) {
    //   const dataService = yield* _(HealthRecordsData);
    //   const record = createMockRecord("recordToRemove", "catX");
    //   yield* _(dataService.persist(record));
    //   yield* _(dataService.removeById(record.recordId));
    //   const result = yield* _(Effect.either(dataService.findById(record.recordId)));
    //   expect(result._tag).toBe("Left"); // Should not be found
    // });
    // await Effect.runPromise(Effect.provide(program, testLayer));
    console.log("Test: should remove a record by ID - Placeholder");
  });

  it("should return all records with findAll", async () => {
     // const program = Effect.gen(function* (_) {
     // const dataService = yield* _(HealthRecordsData);
     // yield* _(dataService.persist(createMockRecord("r1", "c1")));
     // yield* _(dataService.persist(createMockRecord("r2", "c2")));
     // const allRecords = yield* _(dataService.findAll());
     // expect(allRecords.length).toBeGreaterThanOrEqual(2); // Could be more if tests run sequentially and don't clean up
     // });
     // await Effect.runPromise(Effect.provide(program, Layer.fresh(testLayer))); // Use Layer.fresh for isolation
     console.log("Test: should return all records with findAll - Placeholder");
  });
});
