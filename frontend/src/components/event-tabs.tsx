"use client";
import { useQueryState } from "nuqs";
import {
  EventRulesForm,
  RewardRulesForm,
  SchemaForm,
} from "~/components/forms";
import TestCard from "~/components/TestCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

const canEdit = true;

export default function EventTabs() {
  const [currentTab, setCurrentTab] = useQueryState("tab", {
    history: "push",
    shallow: true,
    defaultValue: "schema",
  });

  return (
    <div className="flex w-full flex-col gap-6 h-full min-h-[85dvh]">
      <Tabs
        value={currentTab || "schema"}
        className="w-full h-full flex flex-col"
      >
        <TabsList className="w-full shrink-0">
          <TabsTrigger
            className="cursor-pointer"
            value="schema"
            onClick={() => setCurrentTab("schema")}
          >
            Event Schema
          </TabsTrigger>
          <TabsTrigger
            className="cursor-pointer"
            value="event-rules"
            onClick={() => setCurrentTab("event-rules")}
          >
            Event Rules
          </TabsTrigger>
          <TabsTrigger
            className="cursor-pointer"
            value="reward-rules"
            onClick={() => setCurrentTab("reward-rules")}
          >
            Reward Rules
          </TabsTrigger>
          <TabsTrigger
            className="cursor-pointer"
            value="test"
            onClick={() => setCurrentTab("test")}
          >
            Validation Test
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schema" className="flex-1 min-h-0">
          <SchemaForm />
        </TabsContent>
        <TabsContent value="event-rules" className="flex-1 min-h-0">
          <EventRulesForm />
          {/*{syncEvent && <RulesCard event={syncEvent} readOnly={false}/>}*/}
        </TabsContent>
        <TabsContent value="reward-rules" className="flex-1 min-h-0">
          <RewardRulesForm />
        </TabsContent>
        <TabsContent value="test" className="flex-1 min-h-0">
          <TestCard readOnly={!canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
