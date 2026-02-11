import "server-only";
import {validationsDb} from "~/lib/db";
import {UserSelect} from "~/domain";
import {eq} from "drizzle-orm";
import {users} from "~/lib/db/schema";


export async function fetchUserByEmail(email: string): Promise<[UserSelect, Error | null]> {

    try {
        const user = await validationsDb.query.users.findFirst({
            where: eq(users.email, email)
        });
        return !!user ? [user, null] : [null as any, new Error("User not found")];
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return [null as any, error instanceof Error ? error : new Error("Failed to fetch user by email")];
    }
}