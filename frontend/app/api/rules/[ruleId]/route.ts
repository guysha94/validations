import {type NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {rules} from "@/lib/db/schema";
import {eq} from "drizzle-orm";

type Props = {
    params: Promise<{ ruleId: string; }>;
};

export async function PUT(req: NextRequest, props: Props) {
    const {ruleId} = await props.params;
    const data = await req.json();
    try {

        const result = await db.validations
            .update(rules)
            .set(data)
            .where(eq(rules.id, ruleId));


        const updated = result[0].affectedRows > 0;

        return updated ? NextResponse.json({message: "Rule updated successfully"}, {status: 200}) :
            NextResponse.json({error: "Rule not found"}, {status: 404});


    } catch (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json({error: "Failed to fetch rules"}, {status: 500});
    }
}

