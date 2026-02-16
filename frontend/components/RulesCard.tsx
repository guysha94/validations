"use client";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card";
import {RulesForm} from "~/components/forms/rules-form";
import {EventsSchema} from "~/lib/db/schemas";

type Props = {
    event: EventsSchema;
    readOnly?: boolean;
}

export default function RulesCard({event, readOnly = false}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row">
                    Create Validation Rules For <pre><code>{event.label}</code></pre>
                </CardTitle>
                <CardDescription>
                    Add rules for event validation. Each rule requires a name, error message, and query.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RulesForm eventType={event.type} eventId={event.id} readOnly={readOnly}/>
            </CardContent>
        </Card>
    );
}
