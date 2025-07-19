"use client"

import type { BibleVersion } from '@/lib/bible-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VersionSelectorProps {
  versions: readonly BibleVersion[];
  selectedVersion: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
}

export function VersionSelector({ versions, selectedVersion, onVersionChange }: VersionSelectorProps) {
  return (
    <Card className="bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Versión</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedVersion} onValueChange={onVersionChange}>
          <SelectTrigger className="w-full text-lg p-4 h-auto">
            <SelectValue placeholder="Selecciona una versión" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version} value={version} className="text-lg">
                {version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
