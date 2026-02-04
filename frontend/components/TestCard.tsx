"use client";
import {useState} from "react";

import TestForm from "~/components/forms/TestForm";
import ErrorTable from "~/components/ErrorTable";
import {ValidationErrorInfo} from "~/domain";



export default function TestCard() {


    const [testResults, setTestResults] = useState<ValidationErrorInfo[]>([]);


    return (
        <div className="min-h-[85dvh] flex flex-col gap-6">
            <TestForm  />
            <ErrorTable data={testResults}/>
        </div>
    )
}