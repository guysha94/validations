"use client";
import {useMemo} from "react";

import TestForm from "~/components/forms/TestForm";
import ErrorTable from "~/components/ErrorTable";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";


type Props = {
    readOnly?: boolean;
};

export default function TestCard({readOnly = false}: Props) {
    const {currentEvent, testResults} = useValidationsStore(useShallow((state) => state));
    const errors = useMemo(() => !testResults || !currentEvent ? [] : testResults[currentEvent.type] || [], [testResults, currentEvent]);

    return (
        <div className="min-h-[85dvh] flex flex-col gap-6">
            <TestForm readOnly={readOnly}/>
            <ErrorTable data={errors}/>
        </div>
    );
}