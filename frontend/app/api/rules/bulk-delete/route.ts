import {NextRequest, NextResponse} from "next/server";
import {getUser} from "~/lib/actions";
import {inArray} from "drizzle-orm";
import {rules} from "~/lib/db/schema";
import {db} from "~/lib/db";


export async function POST(req: NextRequest) {
    const user = await getUser();
    if (!user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const data = await req.json() as string[];
    if (!data?.length) {
        return NextResponse.json({error: "No rule ids provided"}, {status: 400});
    }

    try {
        await db.validations.delete(rules).where(inArray(rules.id, data));
        return NextResponse.json({success: true, deletedIds: data}, {status: 200});
    } catch (error) {
        console.error("Error deleting rules:", error);
        return NextResponse.json({error: "Failed to delete rules"}, {status: 500});
    }

}