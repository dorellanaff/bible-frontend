
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Globe, Code, Heart, BrainCircuit } from "lucide-react";

interface InfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoDialog({ isOpen, onOpenChange }: InfoDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            Biblia
          </DialogTitle>
          <DialogDescription>
            Una aplicación moderna y elegante para la lectura de la Biblia.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 mt-0.5 text-primary" />
                <p>
                    Creada con amor y dedicación por Daniel Aguilar.
                </p>
            </div>
            <div className="flex items-start gap-3">
                <BrainCircuit className="h-5 w-5 mt-0.5 text-primary" />
                <p>
                    La interfaz de la aplicación fue generada con ayuda de IA por Firebase Genkit.
                </p>
            </div>
             <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 mt-0.5 text-primary" />
                <p>
                    Los textos bíblicos son obtenidos desde una API pública.
                </p>
            </div>
            <div className="flex items-start gap-3">
                <Code className="h-5 w-5 mt-0.5 text-primary" />
                <p>
                    Desarrollado con las tecnologías Next.js, React, Tailwind CSS, ShadCN y Vercel.
                </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
