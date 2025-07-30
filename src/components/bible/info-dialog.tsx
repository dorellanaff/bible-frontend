
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Globe, Code, Heart, BrainCircuit, Star, CheckCircle } from "lucide-react";

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
        <div className="mt-4 space-y-6 text-sm">
            <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <p>
                    Creada con amor y dedicación para la gloria de Dios.
                </p>
            </div>
            
            <div>
              <h4 className="font-headline text-base mb-3 flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Características Principales</h4>
              <ul className="space-y-2 pl-5">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Comparación de versiones.</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Concordancia bíblica.</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Resaltado de versículos.</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Copia y comparte fácilmente.</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Interfaz intuitiva y fácil de utilizar.</span></li>
              </ul>
            </div>

            <div className="space-y-4">
               <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <p>
                      Los textos bíblicos son obtenidos desde una API pública.
                  </p>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

