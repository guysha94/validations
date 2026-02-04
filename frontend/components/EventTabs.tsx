"use client";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs"

import RulesCard from "~/components/RulesCard";
import TestCard from "~/components/TestCard";
import Loader from "~/components/Loader";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import SchemaForm from "~/components/forms/SchemaForm";


export default function EventTabs() {

    const {isFetchingRules, currentEvent} = useValidationsStore(useShallow((state) => state));


    if (!currentEvent) return null;
    return (
        <div className="flex w-full flex-col gap-6 h-full min-h-[85dvh]">
            <Tabs defaultValue="rules" className="w-full h-full flex flex-col">
                {isFetchingRules && <TabsList className="w-full shrink-0">
                    <TabsTrigger className="cursor-pointer" value="schema">Event Schema</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="rules">Event Rules</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="test">Validation Test</TabsTrigger>
                </TabsList>}
                <TabsContent value="schema" className="flex-1 min-h-0">
                    <SchemaForm/>
                </TabsContent>
                <TabsContent value="rules" className="flex-1 min-h-0">
                    <RulesCard/>
                </TabsContent>
                <TabsContent value="test" className="flex-1 min-h-0">
                    <TestCard/>
                </TabsContent>
            </Tabs>
            {!isFetchingRules && <Loader fullscreen/>}
        </div>
    )
}

