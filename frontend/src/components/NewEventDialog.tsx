"use client";

import {NewEventForm} from "~/components/forms";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "~/components/ui/dialog";
import {useStore} from "~/store";
import {useShallow} from "zustand/react/shallow";


export default function NewEventDialog() {
    const {toggleIsNewEventDialogOpen, isNewEventDialogOpen, activeTeam} = useStore(useShallow(state => state));


    if (!activeTeam) return null;
    return (
        <Dialog
            open={isNewEventDialogOpen}
            onOpenChange={toggleIsNewEventDialogOpen}
            modal={false}
        >
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new event.
                    </DialogDescription>
                </DialogHeader>
                <NewEventForm/>
            </DialogContent>
        </Dialog>
    );
}
