"use client";

import { useCallback } from "react";
import { useSignalValue } from "signals-react-safe";
import { NewEventForm } from "~/components/forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Team } from "~/domain";
import { isNewEventDialogOpen } from "~/lib/signals";

type Props = {
  team: Team;
};

export default function NewEventDialog({ team }: Props) {
  const isNewEventDialogOpenValue = useSignalValue(isNewEventDialogOpen);

  const toggleIsOpen = useCallback(() => {
    isNewEventDialogOpen.value = !isNewEventDialogOpen.value;
  }, []);

  return (
    <Dialog
      open={isNewEventDialogOpenValue}
      onOpenChange={toggleIsOpen}
      modal={false}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new event.
          </DialogDescription>
        </DialogHeader>
        <NewEventForm team={team} toggleDialog={toggleIsOpen} />
      </DialogContent>
    </Dialog>
  );
}
