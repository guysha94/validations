import {type NextRequest, NextResponse} from "next/server";
import {fetchEventRules} from "~/lib/db/crud";

type Props = {
    params: Promise<{ slug: string; }>;
};

export async function GET(req: NextRequest, props: Props) {
    const {slug} = await props.params;
    const [rules, error] = await fetchEventRules(slug);
    return !!error ? NextResponse.json({error: "Failed to fetch rules"}, {status: 500}) : NextResponse.json(rules, {status: 200});
}

