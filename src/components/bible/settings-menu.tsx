
"use client"

import * as React from "react"
import { Computer, Moon, Settings, Sun, Minus, Plus, RefreshCw } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"

interface SettingsMenuProps {
  textSize: number;
  onTextSizeChange: (size: number) => void;
  onDataRefresh: () => void;
}

export function SettingsMenu({ textSize, onTextSizeChange, onDataRefresh }: SettingsMenuProps) {
  const { setTheme } = useTheme()

  const handleSliderChange = (values: number[]) => {
    onTextSizeChange(values[0])
  }
  
  // Prevent the dropdown from closing when interacting with the slider
  const handleItemSelect = (e: Event) => {
    e.preventDefault();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Ajustes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Ajustes de lectura</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
            <span className="text-sm font-medium text-muted-foreground">Tamaño de la fuente</span>
            <div className="flex items-center gap-2 mt-2">
                <Minus className="h-4 w-4" />
                <Slider
                    min={0.8}
                    max={1.5}
                    step={0.1}
                    value={[textSize]}
                    onValueChange={handleSliderChange}
                    aria-label="Tamaño del texto"
                />
                <Plus className="h-4 w-4" />
            </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tema de la aplicación</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Oscuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Computer className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Datos</DropdownMenuLabel>
        <DropdownMenuItem onClick={onDataRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Actualizar datos</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
