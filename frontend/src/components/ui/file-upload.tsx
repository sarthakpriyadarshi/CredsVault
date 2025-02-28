"use client"

import type React from "react"
import { useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FileUploadProps {
  onFileChange: (file: File | null) => void
  value: File | null
  accept?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, value, accept }) => {
  const [fileName, setFileName] = useState<string | null>(value ? value.name : null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      onFileChange(file)
      setFileName(file ? file.name : null)
    },
    [onFileChange],
  )

  const handleClearFile = () => {
    onFileChange(null)
    setFileName(null)
  }

  return (
    <div className="flex items-center space-x-2">
      <Input type="file" id="file" accept={accept} className="hidden" onChange={handleFileChange} />
      <label
        htmlFor="file"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        {fileName || "Select File"}
      </label>
      {fileName && (
        <Button variant="outline" size="sm" onClick={handleClearFile}>
          Clear
        </Button>
      )}
    </div>
  )
}

