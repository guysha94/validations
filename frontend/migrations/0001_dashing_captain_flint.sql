-- Migrate queries from string[] to {query, errorMessage, description}[]
-- Uses JSON_TABLE to expand each string, then JSON_ARRAYAGG to rebuild as objects
CREATE TEMPORARY TABLE reward_rules_queries_migrated AS
SELECT r.id,
       COALESCE(
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
           'query', JSON_UNQUOTE(JSON_EXTRACT(j.query_val, '$')),
           'errorMessage', COALESCE(r.error_message, ''),
           'description', COALESCE(r.description, '')
         ))
          FROM JSON_TABLE(r.queries, '$[*]' COLUMNS (query_val JSON PATH '$')) AS j),
         JSON_ARRAY()
       ) AS new_queries
FROM reward_rules r
WHERE JSON_TYPE(JSON_EXTRACT(r.queries, '$[0]')) = 'STRING';
--> statement-breakpoint
UPDATE reward_rules rr
INNER JOIN reward_rules_queries_migrated m ON rr.id = m.id
SET rr.queries = m.new_queries;
--> statement-breakpoint
DROP TEMPORARY TABLE reward_rules_queries_migrated;
--> statement-breakpoint
ALTER TABLE `reward_rules` DROP COLUMN `description`;
--> statement-breakpoint
ALTER TABLE `reward_rules` DROP COLUMN `error_message`;