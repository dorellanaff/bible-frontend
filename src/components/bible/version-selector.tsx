"use client"

import * as React from 'react'
import type { BibleVersion } from '@/lib/bible-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Trash2, CheckCircle } from 'lucide-react'

interface VersionSelectorProps {
  versions: BibleVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onDownload: (version: string) => void;
  onDelete: (version: string) => void;
  isVersionDownloaded: (version: string) => Promise<boolean>;
}

export function VersionSelector({ versions, selectedVersion, onVersionChange, onDownload, onDelete, isVersionDownloaded }: VersionSelectorProps) {
  const [downloadStatus, setDownloadStatus] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const checkStatus = async () => {
      const status: Record<string, boolean> = {};
      for (const version of versions) {
        status[version.abbreviation] = await isVersionDownloaded(version.abbreviation);
      }
      setDownloadStatus(status);
    };
    if (versions.length > 0) {
      checkStatus();
    }
  }, [versions, isVersionDownloaded]);

  const handleDownload = async (e: React.MouseEvent, version: string) => {
    e.stopPropagation();
    await onDownload(version);
    setDownloadStatus(prev => ({...prev, [version]: true}));
  }

  const handleDelete = async (e: React.MouseEvent, version: string) => {
    e.stopPropagation();
    await onDelete(version);
    setDownloadStatus(prev => ({...prev, [version]: false}));
  }

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
              <div key={version.id} className="flex items-center justify-between pr-2">
                <SelectItem value={version.abbreviation} className="text-lg flex-grow">
                  {version.name}
                </SelectItem>
                {downloadStatus[version.abbreviation] ? (
                   <div className="flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-green-500" />
                     <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, version.abbreviation)} aria-label={`Eliminar ${version.name}`}>
                       <Trash2 className="h-5 w-5 text-destructive" />
                     </Button>
                   </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, version.abbreviation)} aria-label={`Descargar ${version.name}`}>
                    <Download className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
