import { Effect, Either, ReadonlyArray } from "effect";
import { createCat, getAllCats } from "./client.js"; // Assuming client.ts is in the same directory
import { Cat } from "@effect-cats/domain"; // Assuming Cat is exported from domain

const args = process.argv.slice(2); // Skip node executable and script path

const command = args[0];

const parseError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "An unknown error occurred";
}

const main = Effect.gen(function*(_) {
  if (command === "list") {
    console.log("Fetching all cats...");
    const result = yield* _(Effect.either(getAllCats));
    if (Either.isLeft(result)) {
      console.error("Error fetching cats:", parseError(result.left));
      process.exit(1);
    } else {
      if (ReadonlyArray.isEmpty(result.right)) {
        console.log("No cats found.");
      } else {
        console.log("Cats:");
        result.right.forEach((cat) => {
          console.log(`- ID: ${cat.id}, Name: ${cat.name}, Breed: ${cat.breed}, Age: ${cat.age}`);
        });
      }
    }
  } else if (command === "add") {
    const nameArg = args.findIndex((arg) => arg === "--name");
    const breedArg = args.findIndex((arg) => arg === "--breed");
    const ageArg = args.findIndex((arg) => arg === "--age");

    if (nameArg === -1 || breedArg === -1 || ageArg === -1 ||
        args.length < 7 || !args[nameArg+1] || !args[breedArg+1] || !args[ageArg+1]) {
      console.error("Usage: add --name <name> --breed <breed> --age <age>");
      process.exit(1);
    }

    const name = args[nameArg + 1];
    const breed = args[breedArg + 1];
    const age = parseInt(args[ageArg + 1], 10);

    if (isNaN(age)) {
      console.error("Error: Age must be a number.");
      process.exit(1);
    }

    console.log(`Adding cat: ${name}, ${breed}, ${age}`);
    const catToCreate = { name, breed, age }; // Schema for createCat payload doesn't include id

    const result = yield* _(Effect.either(createCat(catToCreate)));

    if (Either.isLeft(result)) {
      console.error("Error adding cat:", parseError(result.left));
      process.exit(1);
    } else {
      const newCat = result.right;
      console.log("Successfully added cat:");
      console.log(`- ID: ${newCat.id}, Name: ${newCat.name}, Breed: ${newCat.breed}, Age: ${newCat.age}`);
    }
  } else {
    console.log("Unknown command. Available commands: list, add");
    process.exit(1);
  }
});

// Run the effect
Effect.runPromise(main).catch(console.error);
