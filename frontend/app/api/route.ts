import {env} from "~/env/server";
import {NextResponse} from "next/server";

export async function GET() {


    return NextResponse.json({ status: "ok", baseUrl: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET });
}
