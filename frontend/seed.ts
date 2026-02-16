import "dotenv/config";
import {count, eq, sql} from "drizzle-orm";
import {validationsDb} from "~/lib/db";
import {auditLogs, organizations, teams} from "~/lib/db/schema";
import {uuidv7} from "uuidv7";
import {AuditLogSelect} from "~/domain";


const org = {
    id: uuidv7(),
    name: "SuperPlay",
    slug: "superplay",
    logo: "https://www.superplay.co/wp-content/uploads/2025/01/cropped-superplay-favicon-16x16-1-32x32.png",
    metadata: "",
    createdAt: new Date(),
};

const teamsToInsert = [
    {
        id: uuidv7(),
        name: "Dice Server Team",
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: uuidv7(),
        name: "Domino Server Team",
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: uuidv7(),
        name: "Disney Server Team",
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
]


const audits: AuditLogSelect[] = [
    {
        id: uuidv7(),
        action: "create",
        entityType: "event",
        entityId: "019c47d8-c93a-72ec-8a5c-98ff8873c19c",
        actorId: "6JkCTBLnsPVxSpe4Pz2rjHAvWzfvPRCB",
        actorType: "user",
        source: "frontend",
        payload: {seeded: true},
        metadata: null,
        teamSlug: "dice-server-team",
        createdAt: new Date(),
    },
    {
        id: uuidv7(),
        action: "update",
        entityType: "event",
        entityId: "019c47d8-c93a-72ec-8a5c-98ff8873c19c",
        actorId: "6JkCTBLnsPVxSpe4Pz2rjHAvWzfvPRCB",
        actorType: "user",
        source: "frontend",
        payload: {seeded: true},
        metadata: null,
        teamSlug: "dice-server-team",
        createdAt: new Date(),
    },
]

for (let i = 0; i < 50; i++) {
    audits.push({
        id: uuidv7(),
        action: "update",
        entityType: "event",
        entityId: `019c47d8-c93a-72ec-8a5c-98ff8873c19${i}`,
        actorId: "6JkCTBLnsPVxSpe4Pz2rjHAvWzfvPRCB",
        actorType: "user",
        source: "frontend",
        payload: {seeded: true, index: i},
        metadata: null,
        teamSlug: "dice-server-team",
        createdAt: new Date(),
    });
}

async function main() {


    // await validationsDb
    //     .insert(auditLogs)
    //     .values(audits);

    const [{countOrgs}] = await validationsDb
        .select({countOrgs: count()})
        .from(organizations);
    if (countOrgs > 0) return;

    await validationsDb
        .insert(organizations)
        .values(org)
        .onDuplicateKeyUpdate({
            set: {

                id: sql.raw("id")
            }
        });

    const existingOrg = await validationsDb.query.organizations.findFirst({
        where: eq(organizations.slug, "superplay"),
    });

    if (!existingOrg) {
        console.error("Failed to insert or find organization");
        process.exit(1);
    }
    for (const team of teamsToInsert) {
        team.organizationId = existingOrg.id;
    }

    const teamsNames = await validationsDb.select({name: teams.name}).from(teams).where(eq(teams.organizationId, existingOrg.id));
    const existingTeamNames = new Set(teamsNames.map(t => t.name));
    const teamsToActuallyInsert = teamsToInsert.filter(t => !existingTeamNames.has(t.name));
    if (!!teamsToActuallyInsert?.length) {
        await validationsDb
            .insert(teams)
            .values(teamsToActuallyInsert)
            .onDuplicateKeyUpdate({
                set: {
                    id: sql.raw("id")
                }
            });
    }


    console.log("Seeding completed successfully!");
}

main().then(
    () => process.exit(0),
    (e) => {
        console.error(e);
        process.exit(1);
    }
);