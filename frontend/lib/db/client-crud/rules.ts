import "client-only";
import {rulesCollection} from "~/lib/db/collections";
import {SelectRule} from "~/domain";
import {rulesSchema} from "~/lib/db/schemas";


export async function createRules(...rules: SelectRule[]): Promise<unknown> {


    const toInsertValidationResult = await rulesSchema.array().safeParseAsync([...rules]);

    if (!toInsertValidationResult.success) {
        console.error("Validation failed for rules:", toInsertValidationResult.error);
        throw new Error("Invalid rule data");
    }
    const toInsert = toInsertValidationResult.data;

    const insertTx = rulesCollection.insert(toInsert, {
        optimistic: true,
    });
    const result = await insertTx.isPersisted.promise;

    console.log("Create rule result:", result);
    return result;
}


export async function updateRules(...rules: SelectRule[]): Promise<unknown> {

    const toUpdateValidationResult = await rulesSchema.array().safeParseAsync([...rules]);
    if (!toUpdateValidationResult.success) {
        console.error("Validation failed for rules:", toUpdateValidationResult.error);
        throw new Error("Invalid rule data");
    }

    const toUpdateObj = toUpdateValidationResult.data.reduce((acc, rule) => {
        acc[rule.id] = rule;
        return acc;
    }, {} as Record<string, SelectRule>);
    const updateTx = rulesCollection.update(Object.keys(toUpdateObj),
        {
            optimistic: true,
        }, (drafts) => {
            drafts.forEach((draft) => {
                const updated = toUpdateObj[draft.id];
                if (updated) {
                    draft.name = updated.name;
                    draft.errorMessage = updated.errorMessage;
                    draft.query = updated.query;
                    draft.enabled = updated.enabled;
                    draft.updatedAt = new Date();
                }
            })
        });
    const result = await updateTx.isPersisted.promise;

    console.log("Update rule result:", result);
    return result;
}

export async function deleteRules(...rulesIds: string[]): Promise<unknown> {

    const ids = Array.from(new Set([...rulesIds]));
    const deleteTx = rulesCollection.delete(ids, {
        optimistic: true,
    });
    const result = await deleteTx.isPersisted.promise;

    console.log("Delete rule result:", result);
    return result;

}