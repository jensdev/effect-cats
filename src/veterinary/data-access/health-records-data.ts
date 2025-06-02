import { Array, Context, Effect, HashMap, Layer, Option, Ref } from "effect";
import { CatId } from "../../domain/cats"; // Path to the original CatId
import { HealthRecord, HealthRecordId } from "../domain/health-record";
import { HealthRecordNotFoundError, CatHealthRecordsNotFoundError } from "../domain/errors";

export class HealthRecordsData extends Context.Tag("HealthRecordsData")<
  HealthRecordsData,
  {
    readonly findById: (id: HealthRecordId) => Effect.Effect<HealthRecord, HealthRecordNotFoundError>;
    readonly persist: (record: HealthRecord) => Effect.Effect<void>;
    readonly findAllByCatId: (catId: CatId) => Effect.Effect<ReadonlyArray<HealthRecord>, CatHealthRecordsNotFoundError>;
    readonly removeById: (id: HealthRecordId) => Effect.Effect<void, HealthRecordNotFoundError>;
    // Optional: A method to get all records, if needed for admin purposes
    readonly findAll: () => Effect.Effect<ReadonlyArray<HealthRecord>>;
  }
>() {}

export const makeHealthRecordsData = Effect.gen(function* () {
  const healthRecordsState = yield* Ref.make(HashMap.empty<HealthRecordId, HealthRecord>());

  const findById = (id: HealthRecordId): Effect.Effect<HealthRecord, HealthRecordNotFoundError> =>
    Ref.get(healthRecordsState).pipe(
      Effect.flatMap(HashMap.get(id)),
      Effect.catchTag(
        "NoSuchElementException",
        () => Effect.fail(HealthRecordNotFoundError.of({ recordId: id }))
      )
    );

  const persist = (record: HealthRecord): Effect.Effect<void> =>
    Ref.update(healthRecordsState, HashMap.set(record.recordId, record));

  const findAllByCatId = (catId: CatId): Effect.Effect<ReadonlyArray<HealthRecord>, CatHealthRecordsNotFoundError> =>
    Ref.get(healthRecordsState).pipe(
      Effect.map(HashMap.values),
      Effect.map(Array.fromIterable),
      Effect.map(records => records.filter(record => record.catId === catId)),
      Effect.filterOrFail(
        records => records.length > 0,
        () => Effect.fail(CatHealthRecordsNotFoundError.of({ catId }))
      )
    );

  const findAll = (): Effect.Effect<ReadonlyArray<HealthRecord>> =>
     Ref.get(healthRecordsState).pipe(
         Effect.map(HashMap.values),
         Effect.map(Array.fromIterable)
     );

  const removeById = (id: HealthRecordId): Effect.Effect<void, HealthRecordNotFoundError> =>
    Ref.get(healthRecordsState).pipe(
      Effect.flatMap(recordsMap =>
        HashMap.has(recordsMap, id)
          ? Ref.update(healthRecordsState, HashMap.remove(id))
          : Effect.fail(HealthRecordNotFoundError.of({ recordId: id }))
      )
    );

  return {
    findById,
    persist,
    findAllByCatId,
    findAll,
    removeById,
  } as const;
});

export const HealthRecordsDataLayer = Layer.effect(HealthRecordsData, makeHealthRecordsData);
