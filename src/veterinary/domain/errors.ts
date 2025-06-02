import { Schema } from "effect";

export class HealthRecordNotFoundError extends Schema.TaggedError<HealthRecordNotFoundError>()(
  "HealthRecordNotFoundError",
  {
    recordId: Schema.String, // Or CatId if searching by CatId and none are found
    message: Schema.String, // Optional: provide a more descriptive message
  },
) {
  static of = (input: { recordId: string, message?: string }) =>
    new HealthRecordNotFoundError({ ...input, message: input.message || `Health record with ID ${input.recordId} not found.` });
}

export class CatHealthRecordsNotFoundError extends Schema.TaggedError<CatHealthRecordsNotFoundError>()(
 "CatHealthRecordsNotFoundError",
 {
   catId: Schema.String,
   message: Schema.String,
 }
) {
 static of = (input: { catId: string, message?: string }) =>
   new CatHealthRecordsNotFoundError({ ...input, message: input.message || `No health records found for cat ID ${input.catId}.` });
}
