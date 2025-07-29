"use client"

import * as React from 'react'
import type { BibleVersion } from '@/lib/bible-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Trash2, CheckCircle } from 'lucide-react'

interface VersionSelectorProps {
  versions: readonly BibleVersion[];
  selectedVersion: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
  onDownload: (version: BibleVersion) => void;
  onDelete: (version: BibleVersion) => void;
  isVersionDownloaded: (version: BibleVersion) => Promise<boolean>;
}

export function VersionSelector({ versions, selectedVersion, onVersionChange, onDownload, onDelete, isVersionDownloaded }: VersionSelectorProps) {
  const [downloadStatus, setDownloadStatus] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const checkStatus = async () => {
      const status: Record<string, boolean> = {};
      for (const version of versions) {
        status[version] = await isVersionDownloaded(version);
      }
      setDownloadStatus(status);
    };
    checkStatus();
  }, [versions, isVersionDownloaded]);

  const handleDownload = async (e: React.MouseEvent, version: BibleVersion) => {
    e.stopPropagation();
    await onDownload(version);
    setDownloadStatus(prev => ({...prev, [version]: true}));
  }

  const handleDelete = async (e: React.MouseEvent, version: BibleVersion) => {
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
              <div key={version} className="flex items-center justify-between pr-2">
                <SelectItem value={version} className="text-lg flex-grow">
                  {version}
                </SelectItem>
                {downloadStatus[version] ? (
                   <div className="flex items-center gap-2">
                     <CheckCircle className="h-5 w-5 text-green-500" />
                     <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, version)} aria-label={`Eliminar ${version}`}>
                       <Trash2 className="h-5 w-5 text-destructive" />
                     </Button>
                   </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, version)} aria-label={`Descargar ${version}`}>
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
