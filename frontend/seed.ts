import "dotenv/config";
import {eq, sql} from "drizzle-orm";
import {validationsDb} from "~/lib/db";
import {organizations, teams} from "~/lib/db/schema";
import { uuidv7 } from "uuidv7";


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


async function main() {


    await validationsDb
        .insert(organizations)
        .values(org)
        .onDuplicateKeyUpdate({
            set: {

                id: sql`id`
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
                    id: sql`id`
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