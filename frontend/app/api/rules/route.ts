import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {rules} from "~/lib/db/schema";
import {eq} from "drizzle-orm";
import {uuidv7} from "~/lib/utils";


export async function GET(req: NextRequest) {

    try {
        const allRules = await db.validations
            .query.rules.findMany();
        return NextResponse.json(allRules, {status: 200});
    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}


export async function POST(req: NextRequest) {
    const data = await req.json();
    const newRules = (Array.isArray(data) ? data : [data])
        .map(rule => ({
            ...rule,
            id: uuidv7(),
            updatedAt: new Date()

        }));

    try {
        const newRuleId = await db.validations
            .insert(rules)
            .values(newRules)
            .$returningId();
        if (!newRuleId?.length) {
            return NextResponse.json({error: "Failed to create rule"}, {status: 500});
        }
        const newRule = await db.validations
            .query.rules.findFirst({
                where: eq(rules.id, (newRuleId[0] as any).id)
            });

        return NextResponse.json(newRule, {status: 201});
    } catch (error) {
        console.error("Error creating rule:", error);
        return NextResponse.json({error: "Failed to create rule"}, {status: 500});
        //SELECT * FROM Globals WHERE Parameter = 'MaxBucketSize' AND CAST(Value AS INTEGER) NOT BETWEEN 2 AND 500;
    }
}