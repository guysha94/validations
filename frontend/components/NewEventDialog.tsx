"use client"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import NewEventForm from "~/components/forms/NewEventForm";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";

export default function NewEventDialog() {

    const {addFormOpen, toggleAddFormOpen} = useValidationsStore(useShallow((state) => state));

    return (
        <Dialog open={addFormOpen} onOpenChange={toggleAddFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new event.
                    </DialogDescription>
                </DialogHeader>
                <NewEventForm/>
            </DialogContent>
        </Dialog>
    )
}
