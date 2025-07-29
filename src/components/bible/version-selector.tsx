
"use client"

import * as React from 'react'
import type { BibleVersion } from '@/lib/bible-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Trash2, CheckCircle, Loader } from 'lucide-react'

interface VersionSelectorProps {
  versions: BibleVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onDownload: (version: string) => void;
  onDelete: (version: string) => void;
  isVersionDownloaded: (version: string, markAsDownloading?: boolean) => Promise<boolean>;
}

export function VersionSelector({ versions, selectedVersion, onVersionChange, onDownload, onDelete, isVersionDownloaded }: VersionSelectorProps) {
  const [downloadStatus, setDownloadStatus] = React.useState<Record<string, 'downloaded' | 'not-downloaded' | 'downloading'>>({});

  React.useEffect(() => {
    const checkStatus = async () => {
      const status: Record<string, 'downloaded' | 'not-downloaded' | 'downloading'> = {};
      for (const version of versions) {
        const isDownloaded = await isVersionDownloaded(version.abbreviation);
        status[version.abbreviation] = isDownloaded ? 'downloaded' : 'not-downloaded';
      }
      setDownloadStatus(status);
    };
    if (versions.length > 0) {
      checkStatus();
    }
  }, [versions, isVersionDownloaded]);

  const handleDownload = async (e: React.MouseEvent, version: string) => {
    e.stopPropagation();
    setDownloadStatus(prev => ({...prev, [version]: 'downloading'}));
    await onDownload(version);
    setDownloadStatus(prev => ({...prev, [version]: 'downloaded'}));
  }

  const handleDelete = async (e: React.MouseEvent, version: string) => {
    e.stopPropagation();
    await onDelete(version);
    setDownloadStatus(prev => ({...prev, [version]: 'not-downloaded'}));
  }
  
  const getButtonState = (versionAbbr: string) => {
    const status = downloadStatus[versionAbbr];
    if (status === 'downloading') {
        return (
            <Loader className="h-5 w-5 text-primary animate-spin" />
        )
    }
    if (status === 'downloaded') {
        return (
            <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, versionAbbr)} aria-label={`Eliminar ${versionAbbr}`}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
            </div>
        )
    }
    return (
        <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, versionAbbr)} aria-label={`Descargar ${versionAbbr}`}>
            <Download className="h-5 w-5" />
        </Button>
    )
  }

  return (
    <Card className="card-material">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Versión</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedVersion} onValueChange={onVersionChange}>
          <SelectTrigger className="w-full text-base py-3 h-auto">
            <SelectValue placeholder="Selecciona una versión" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <div key={version.id} className="flex items-center justify-between pr-2">
                <SelectItem value={version.abbreviation} className="text-base flex-grow">
                  {version.name} ({version.abbreviation})
                </SelectItem>
                <div className="ml-2">
                    {getButtonState(version.abbreviation)}
                </div>
              </div>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
