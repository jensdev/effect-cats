import { Schema } from "effect";
import { CatId } from "../../domain/cats"; // Assuming CatId will be imported from the existing cats domain

// HealthRecordId
export const HealthRecordId = Schema.String.pipe(Schema.brand("HealthRecordId"));
export type HealthRecordId = typeof HealthRecordId.Type;

// EventType for health records
export const HealthRecordEventType = Schema.Literal("Vaccination", "Checkup", "Medication", "Routine Visit", "Emergency");
export type HealthRecordEventType = typeof HealthRecordEventType.Type;

// HealthRecord Schema
export class HealthRecord extends Schema.Class<HealthRecord>("HealthRecord")({
  recordId: HealthRecordId,
  catId: CatId, // Linking to the Cat from the original context
  date: Schema.Date,
  eventType: HealthRecordEventType,
  notes: Schema.String,
  veterinarianName: Schema.OptionFromNullOr(Schema.String), // Optional: name of the vet
}) {}
