"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, X, File } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileChange: (file: File | null) => void
  value?: File | null
  accept?: string
  maxSize?: number
  preview?: boolean
  className?: string
  id?: string
  style?: React.CSSProperties
}

export function FileUpload({
  onFileChange,
  value,
  accept = "image/*,application/pdf",
  maxSize = 5 * 1024 * 1024, // 5MB
  preview = true,
  className,
  ...props
}: FileUploadProps & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        onFileChange(file)
      }
    },
    [onFileChange],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept ? { [accept.includes(",") ? accept.split(",")[0] : accept]: [] } : undefined,
    maxSize,
    multiple: false,
  })

  React.useEffect(() => {
    if (value && preview) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          setPreviewUrl(e.target.result)
        }
      }
      reader.readAsDataURL(value)
    } else {
      setPreviewUrl(null)
    }
  }, [value, preview])

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileChange(null)
    setPreviewUrl(null)
  }

  const fileError = fileRejections.length > 0 ? fileRejections[0].errors[0].message : null

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors",
          isDragActive ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25",
          fileError && "border-destructive/50 bg-destructive/5",
        )}
      >
        <input {...getInputProps()} />

        {value ? (
          <div className="flex flex-col items-center gap-2">
            {previewUrl && previewUrl.startsWith("data:image") ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-md">
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                <File className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="text-sm font-medium">{value.name}</div>
            <div className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(2)} KB</div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleRemove}>
              <X className="mr-2 h-4 w-4" />
              Remove file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-medium">{isDragActive ? "Drop the file here" : "Drag & drop file here"}</span>
              <span className="text-sm text-muted-foreground">or click to browse</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {accept.replace(/\./g, "").toUpperCase()} up to {(maxSize / 1024 / 1024).toFixed(0)}MB
            </div>
          </div>
        )}
      </div>

      {fileError && <div className="text-sm text-destructive">{fileError}</div>}
    </div>
  )
}

