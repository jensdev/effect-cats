import { Context, Effect, Layer } from "effect";
import { HealthRecordsData } from "../data-access/health-records-data";
import { HealthRecord, HealthRecordId } from "../domain/health-record";
import { CatId } from "../../domain/cats"; // Path to the original CatId
import { HealthRecordNotFoundError, CatHealthRecordsNotFoundError } from "../domain/errors";

// Define the interface for the service
export class HealthRecordsService extends Context.Tag("HealthRecordsService")<
  HealthRecordsService,
  {
    readonly addRecord: (recordDetails: {
      catId: CatId;
      date: Date;
      eventType: HealthRecord["eventType"];
      notes: string;
      veterinarianName?: string | null; // Making it optional as in the schema
    }) => Effect.Effect<HealthRecord>; // Returns the created record
    readonly getRecordsForCat: (catId: CatId) => Effect.Effect<ReadonlyArray<HealthRecord>, CatHealthRecordsNotFoundError>;
    readonly getRecordById: (recordId: HealthRecordId) => Effect.Effect<HealthRecord, HealthRecordNotFoundError>;
    readonly deleteRecord: (recordId: HealthRecordId) => Effect.Effect<void, HealthRecordNotFoundError>;
  }
>() {}

// Implementation of the service
export const makeHealthRecordsService = Effect.gen(function* () {
  const healthRecordsData = yield* HealthRecordsData;

  // Function to generate a new HealthRecordId - simple version for now
  const generateRecordId = () => Effect.sync(() => `record-${Math.random().toString(36).substring(2, 9)}` as HealthRecordId);

  const addRecord = Effect.fn("HealthRecordsService.addRecord")(
    function* (recordDetails: {
      catId: CatId;
      date: Date;
      eventType: HealthRecord["eventType"];
      notes: string;
      veterinarianName?: string | null;
    }) {
      const newRecordId = yield* generateRecordId();
      const record = new HealthRecord({
        ...recordDetails,
        recordId: newRecordId,
        veterinarianName: recordDetails.veterinarianName ?? undefined, // Handle null to Option
      });
      yield* Effect.log("Adding health record").pipe(Effect.annotateLogs({ catId: record.catId, recordId: record.recordId }));
      yield* healthRecordsData.persist(record);
      return record;
    }
  );

  const getRecordsForCat = Effect.fn("HealthRecordsService.getRecordsForCat")(
    function* (catId: CatId) {
      yield* Effect.log("Getting health records for cat").pipe(Effect.annotateLogs({ catId }));
      return yield* healthRecordsData.findAllByCatId(catId);
    }
  );

  const getRecordById = Effect.fn("HealthRecordsService.getRecordById")(
    function* (recordId: HealthRecordId) {
      yield* Effect.log("Getting health record by ID").pipe(Effect.annotateLogs({ recordId }));
      return yield* healthRecordsData.findById(recordId);
    }
  );

  const deleteRecord = Effect.fn("HealthRecordsService.deleteRecord")(
    function* (recordId: HealthRecordId) {
      yield* Effect.log("Deleting health record").pipe(Effect.annotateLogs({ recordId }));
      return yield* healthRecordsData.removeById(recordId);
    }
  );

  return {
    addRecord,
    getRecordsForCat,
    getRecordById,
    deleteRecord,
  } as const;
});

export const HealthRecordsServiceLayer = Layer.effect(HealthRecordsService, makeHealthRecordsService);
