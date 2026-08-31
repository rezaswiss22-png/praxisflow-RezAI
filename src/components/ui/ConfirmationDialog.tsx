"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bestätigungsdialog für medizinische/kritische Aktionen.
 * JEDE medizinisch relevante Aktion MUSS über diesen Dialog bestätigt werden
 * (Vier-Augen-/Absicherungs-Prinzip auf UI-Ebene).
 */
export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titel: string;
  beschreibung: string;
  bestaetigenText?: string;
  abbrechenText?: string;
  gefahr?: boolean;
  onBestaetigen: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  titel,
  beschreibung,
  bestaetigenText = "Bestätigen",
  abbrechenText = "Abbrechen",
  gefahr = false,
  onBestaetigen,
}: ConfirmationDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            {gefahr && <AlertTriangle className="h-5 w-5 text-ampel-rot" aria-hidden />}
            <Dialog.Title className="text-lg font-semibold text-slate-800">{titel}</Dialog.Title>
          </div>
          <Dialog.Description className="mb-5 text-sm text-slate-600">
            {beschreibung}
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button type="button" className="btn-secondary">
                {abbrechenText}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={cn(gefahr ? "btn-danger" : "btn-primary")}
              onClick={() => {
                onBestaetigen();
                onOpenChange(false);
              }}
            >
              {bestaetigenText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
