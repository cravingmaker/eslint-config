import { describe, expect, it } from "vitest";

import {
  createEslint,
  describeSnapshot,
  effectiveScenarios,
} from "./effective-scenarios.js";

// `effective-scenarios.ts` describes the scenarios, which `npm run policy:diff` compares as well.
describe.each(effectiveScenarios)(
  "effective rules: $name",
  ({ options, snapshots }) => {
    const eslint = createEslint(options);

    it.each(snapshots)(
      "matches the reviewed policy for $filePath",
      async (snapshot) => {
        const description = await describeSnapshot(await eslint, snapshot);

        await expect(description).toMatchFileSnapshot(
          `./__snapshots__/effective-rules/${snapshot.path}`,
        );
      },
    );
  },
);
