import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';
import {eventRules, events, rewardRules, teams} from '~/db/schema';
import {z} from 'zod';

export const selectEventSchema = createSelectSchema(events);
export const createEventSchema = createInsertSchema(events);
export const updateEventSchema = createUpdateSchema(events);

export const selectEventRuleSchema = createSelectSchema(eventRules);
export const createEventRuleSchema = createInsertSchema(eventRules);
export const updateEventRuleSchema = createUpdateSchema(eventRules);

export const selectRewardRuleSchema = createSelectSchema(rewardRules);
export const createRewardRuleSchema = createInsertSchema(rewardRules);
export const updateRewardRuleSchema = createUpdateSchema(rewardRules);

export const selectTeamSchema = createSelectSchema(teams);
export const createTeamSchema = createInsertSchema(teams);
export const updateTeamSchema = createUpdateSchema(teams);



export type CreateEventDto = z.infer<typeof createEventSchema>;
export type SelectEventDto = z.infer<typeof selectEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;