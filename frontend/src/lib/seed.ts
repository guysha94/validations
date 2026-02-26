import { sql } from "drizzle-orm";
import slugify from "slugify";
import { uuidv7 } from "uuidv7";
import db from "~/db";
import {
  eventRules,
  events,
  organizations,
  rewardRules,
  teams,
} from "~/db/schema";
import {
  ORGANIZATION_LOGO_URL,
  ORGANIZATION_NAME,
  ORGANIZATION_SLUG,
  TEAM_NAMES,
} from "~/lib/constants";

export async function addSeedData() {
  const createdAt = new Date();
  const org = {
    id: uuidv7(),
    name: ORGANIZATION_NAME,
    slug: ORGANIZATION_SLUG,
    logo: ORGANIZATION_LOGO_URL,
    metadata: {},
    createdAt,
  };
  const teamsToInsert = TEAM_NAMES.map((name) => ({
    id: uuidv7(),
    name,
    slug: slugify(name, { lower: true }),
    organizationId: org.id,
    createdAt,
    updatedAt: createdAt,
  }));
  const teamId = teamsToInsert[0].id;
  const eventsToInsert = [
    {
      id: uuidv7(),
      teamId,
      createdById: null,
      editAccess: "public",
      type: "TournamentsV2",
      label: "Tournaments V2",
      icon: "Trophy",
      eventSchema: {
        Actions: ["Action", "Points"],
        Globals: ["Parameter", "Value"],
      },
    },
    {
      id: uuidv7(),
      teamId,
      createdById: null,
      editAccess: "restricted",
      type: "LavaQuest",
      label: "Lava Quest",
      icon: "Flame",
      eventSchema: {},
    },
  ];
  const eventId = eventsToInsert[0].id;
  const eventRulesToInsert = [
    {
      id: uuidv7(),
      eventId,
      name: "Tournament V2 Max Bucket Size Rule",
      description:
        "This rule checks that the MaxBucketSize global parameter is set to a value between 2 and 500. If the value is outside this range, it will trigger a validation error.",
      errorMessage: "Globals.MaxBucketSize must be between 2-500",
      query:
        "SELECT * FROM Globals WHERE Parameter = 'MaxBucketSize' AND CAST(Value AS INTEGER) NOT BETWEEN 2 AND 500;",
      enabled: true,
      updatedAt: createdAt,
      createdAt,
      editAccess: "public",
    },
  ];
  const rewardRulesToInsert = [
    {
      id: uuidv7(),
      eventId,
      name: "Visuals validation",
      enabled: true,
      updatedAt: createdAt,
      editAccess: "public",
      queries: [
        {
          query: "SELECT * FROM mtx_event;",
          errorMessage: "error message",
          description:
            "This rule validates the visuals configuration for the tournament.",
        },
      ],
      tab: "Globals",
      column: "Parameter",
      createdAt,
    },
  ];
  try {
    await db
      .insert(organizations)
      .values(org)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await db
      .insert(teams)
      .values(teamsToInsert)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await db
      .insert(events)
      .values(eventsToInsert as any)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await Promise.all([
      db
        .insert(eventRules)
        .values(eventRulesToInsert)
        .onDuplicateKeyUpdate({ set: { id: sql`id` } }),
      db
        .insert(rewardRules)
        .values(rewardRulesToInsert as any)
        .onDuplicateKeyUpdate({ set: { id: sql`id` } }),
    ]);
  } catch (error) {
    console.error("Error adding seed data:", error);
  }
}
