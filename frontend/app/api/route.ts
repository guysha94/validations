import {NextResponse} from "next/server";
import {getDbTables} from "~/lib/db/queries";


export async function GET() {

    const dbTables = await getDbTables();

    return NextResponse.json(dbTables);
}
