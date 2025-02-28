"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Award, Check, Download, Eye } from 'lucide-react'
import jsPDF from "jspdf"
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Placeholder {
  _id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontStyle: string
  align: string
  fill: string
}

interface Template {
  _id: string
  name: string
  templateImage: string
  placeholders: Placeholder[]
}

export default function CredentialsIssuer() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [issueStatus, setIssueStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [stageWidth, setStageWidth] = useState(800)
  const [stageHeight, setStageHeight] = useState(450)
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null)

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const res = await axios.get("http://localhost:3000/api/template", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setTemplates(res.data)
      } catch (error) {
        console.error("Error fetching templates:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // Handle template selection
  const handleTemplateSelect = (value: string) => {
    const template = templates.find((t) => t._id === value) || null
    setSelectedTemplate(template)
    setFormData({}) // Reset form data when a new template is selected

    if (template) {
      // Load the template image
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.src = template.templateImage
      img.onload = () => {
        setBgImage(img)
        setOriginalImageDimensions({ width: img.width, height: img.height })
        
        // Set stage dimensions based on image
        const aspectRatio = img.width / img.height
        const maxWidth = Math.min(800, window.innerWidth - 80)
        setStageWidth(maxWidth)
        setStageHeight(maxWidth / aspectRatio)
      }
    }
  }

  // Handle input changes for template-specific fields
  const handleInputChange = (placeholder: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [placeholder]: value,
    }))
  }

  // Generate a PDF with the credential
  const generatePDF = () => {
    if (!stageRef.current || !selectedTemplate) return null

    // Get the stage as a data URL
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })

    // Create PDF with the image
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [stageWidth, stageHeight],
    })

    pdf.addImage(dataURL, "PNG", 0, 0, stageWidth, stageHeight)

    return {
      pdf,
      imageData: dataURL,
    }
  }

  // Handle credential issuance
  const handleIssueCredential = async () => {
    if (!selectedTemplate) {
      alert("Please select a template")
      return
    }

    // Check if email field is filled
    if (!formData["email"] || formData["email"].trim() === "") {
      alert("Please fill in the recipient email")
      return
    }

    // Check if all template-specific fields are filled
    const missingFields = selectedTemplate.placeholders.filter(
      (ph) => !formData[ph.label] || formData[ph.label].trim() === "",
    )
    if (missingFields.length > 0) {
      alert(`Please fill in all fields: ${missingFields.map((f) => f.label).join(", ")}`)
      return
    }

    setIssueStatus("loading")

    // Generate PDF and image
    const generated = generatePDF()
    if (!generated) {
      setIssueStatus("error")
      return
    }

    const { pdf, imageData } = generated

    // Save PDF as a file for download
    pdf.save(`credential_${selectedTemplate.name}_${Date.now()}.pdf`)

    const payload = {
      templateId: selectedTemplate._id,
      recipientEmail: formData["email"],
      data: formData,
      credentialPDF: pdf.output("datauristring"),
      credentialImage: imageData,
    }

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post("/api/company/creds/issue", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log("Credential issued:", res.data)
      setIssueStatus("success")
      setTimeout(() => {
        setIssueStatus("idle")
        setFormData({})
      }, 3000)
    } catch (error) {
      console.error("Error issuing credential:", error)
      setIssueStatus("error")
      setTimeout(() => setIssueStatus("idle"), 3000)
    }
  }

  // Download the credential as PDF
  const handleDownloadPDF = () => {
    if (generatePDF()) {
      const { pdf } = generatePDF()!
      pdf.save(`credential_${selectedTemplate?.name}_${Date.now()}.pdf`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential Issuer</CardTitle>
        <CardDescription>Select a template and fill in the details to issue a credential</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template selection */}
        <div className="space-y-2">
          <Label htmlFor="template-select">Select Template</Label>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No templates available
                  </SelectItem>
                ) : (
                  templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Form section with email and template-specific fields */}
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-4">Fill in Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Fixed email field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData["email"] || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter recipient email"
                  />
                </div>
                {/* Dynamic template-specific fields */}
                {selectedTemplate.placeholders.map((ph) => (
                  <div key={ph._id} className="space-y-2">
                    <Label htmlFor={`field-${ph._id}`}>{ph.label}</Label>
                    <Input
                      id={`field-${ph._id}`}
                      value={formData[ph.label] || ""}
                      onChange={(e) => handleInputChange(ph.label, e.target.value)}
                      placeholder={`Enter ${ph.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview button */}
            <div className="flex justify-end">
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview Credential
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Credential Preview</DialogTitle>
                    <DialogDescription>Preview how the credential will look with your data</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex flex-col items-center">
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preview" className="flex justify-center">
                        <div className="border rounded-lg overflow-hidden max-w-full">
                          <Stage 
                            width={stageWidth} 
                            height={stageHeight} 
                            ref={stageRef}
                            style={{ maxWidth: '100%', maxHeight: '70vh' }}
                          >
                            <Layer>
                              {/* Background template image */}
                              {bgImage && <KonvaImage image={bgImage} width={stageWidth} height={stageHeight} />}

                              {/* Render placeholders with user data */}
                              {selectedTemplate.placeholders.map((placeholder) => {
                                // Calculate the scaled position based on the original template dimensions
                                const scaleX = stageWidth / originalImageDimensions.width;
                                const scaleY = stageHeight / originalImageDimensions.height;
                                
                                return (
                                  <Text
                                    key={placeholder._id}
                                    x={placeholder.x * scaleX}
                                    y={placeholder.y * scaleY}
                                    width={placeholder.width * scaleX}
                                    height={placeholder.height * scaleY}
                                    text={formData[placeholder.label] || placeholder.label}
                                    fontSize={placeholder.fontSize * Math.min(scaleX, scaleY)}
                                    fontFamily={placeholder.fontFamily}
                                    fontStyle={placeholder.fontStyle}
                                    align={placeholder.align}
                                    fill={placeholder.fill}
                                  />
                                );
                              })}
                            </Layer>
                          </Stage>
                        </div>
                      </TabsContent>
                      <TabsContent value="data">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">Template Data</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="font-semibold">Template Name:</div>
                            <div>{selectedTemplate.name}</div>

                            <div className="font-semibold">Template ID:</div>
                            <div className="truncate">{selectedTemplate._id}</div>

                            <div className="font-semibold">Placeholders:</div>
                            <div>{selectedTemplate.placeholders.length}</div>

                            <div className="col-span-2 mt-4 font-semibold">Filled Data:</div>
                            {Object.entries(formData).map(([key, value]) => (
                              <React.Fragment key={key}>
                                <div className="font-medium">{key}:</div>
                                <div>{value}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <Button onClick={handleDownloadPDF} variant="outline" className="mt-4 gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer with issue button and status alerts */}
      {selectedTemplate && (
        <CardFooter className="flex items-center justify-between">
          <Button
            onClick={handleIssueCredential}
            disabled={issueStatus === "loading" || !selectedTemplate}
            className="gap-2"
          >
            {issueStatus === "loading" ? (
              "Issuing..."
            ) : (
              <>
                <Award className="h-4 w-4" />
                Issue Credential
              </>
            )}
          </Button>

          {issueStatus === "success" && (
            <Alert variant="success" className="ml-4">
              <AlertDescription className="flex items-center">
                <Check className="mr-2 h-4 w-4" />
                Credential issued successfully!
              </AlertDescription>
            </Alert>
          )}

          {issueStatus === "error" && (
            <Alert variant="destructive" className="ml-4">
              <AlertDescription>Failed to issue credential.</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      )}
    </Card>
  )
}