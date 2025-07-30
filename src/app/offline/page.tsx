"use client"

import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-4 text-2xl font-headline">
            <WifiOff className="h-16 w-16 text-destructive" />
            <span>Sin Conexión a Internet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            No tienes conexión a internet. Esta página no pudo ser cargada desde el caché.
            Por favor, revisa tu conexión e inténtalo de nuevo.
          </p>
          <Button asChild>
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
