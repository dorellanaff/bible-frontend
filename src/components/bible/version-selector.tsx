
"use client"

import * as React from 'react'
import type { BibleVersion } from '@/lib/bible-data'
import { Button } from '@/components/ui/button'
import { Download, Trash2, CheckCircle, Loader, ChevronsUpDown } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '../ui/scroll-area'

interface VersionSelectorProps {
  versions: BibleVersion[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onDownload: (version: string) => void;
  onDelete: (version: string) => void;
  isVersionDownloaded: (version: string, markAsDownloading?: boolean) => Promise<boolean>;
}

function VersionList({ versions, onVersionChange, getButtonState }: {
    versions: BibleVersion[];
    onVersionChange: (version: string) => void;
    getButtonState: (abbr: string) => React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 p-2">
            {versions.map(version => (
              <div key={version.id} className="flex items-center justify-between">
                 <Button
                    variant="ghost"
                    className="w-full justify-start text-base h-auto py-3"
                    onClick={() => onVersionChange(version.abbreviation)}
                >
                    {version.name} ({version.abbreviation})
                </Button>
                <div className="ml-2 pr-2">
                    {getButtonState(version.abbreviation)}
                </div>
              </div>
            ))}
        </div>
    );
}

export function VersionSelector({ versions, selectedVersion, onVersionChange, onDownload, onDelete, isVersionDownloaded }: VersionSelectorProps) {
  const [downloadStatus, setDownloadStatus] = React.useState<Record<string, 'downloaded' | 'not-downloaded' | 'downloading'>>({});
  const [isOpen, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

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
  
  const handleVersionSelect = (version: string) => {
      onVersionChange(version);
      setOpen(false);
  }

  const triggerButton = (
    <Button variant="ghost" className="text-base sm:text-lg font-bold gap-2 pl-1 pr-2">
        {selectedVersion}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
    </Button>
  );

  const content = <VersionList versions={versions} onVersionChange={handleVersionSelect} getButtonState={getButtonState} />;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
            {triggerButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-headline text-2xl">Seleccionar Versión</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[70vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            {triggerButton}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" side="bottom" align="start">
            {content}
        </PopoverContent>
    </Popover>
  )
}
