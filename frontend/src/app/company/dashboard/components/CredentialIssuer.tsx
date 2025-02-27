"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Award, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Template {
  id: string
  name: string
  placeholders: { id: string; label: string }[]
}

export default function CredentialIssuer() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [issueStatus, setIssueStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const res = await axios.get("http://localhost:3000/api/company/template", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setTemplates(res.data.templates || [])
      } catch (error) {
        console.error("Error fetching templates:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const handleTemplateSelect = (value: string) => {
    const template = templates.find((t) => t.id === value) || null
    setSelectedTemplate(template)
    setFormData({}) // reset form data
  }

  const handleInputChange = (placeholder: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [placeholder]: value,
    }))
  }

  const handleIssueCredential = async () => {
    if (!selectedTemplate) {
      alert("Please select a template")
      return
    }

    // Check if all fields are filled
    const missingFields = selectedTemplate.placeholders.filter(
      (ph) => !formData[ph.label] || formData[ph.label].trim() === "",
    )

    if (missingFields.length > 0) {
      alert(`Please fill in all fields: ${missingFields.map((f) => f.label).join(", ")}`)
      return
    }

    setIssueStatus("loading")
    // Prepare credential payload
    const payload = {
      templateId: selectedTemplate.id,
      data: formData,
    }

    try {
      const token = localStorage.getItem("token")
      const res = await axios.post("/api/company/creds/issue", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log(res)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential Issuer</CardTitle>
        <CardDescription>Select a template and fill in the details to issue a credential</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedTemplate && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-4">Fill in Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedTemplate.placeholders.map((ph) => (
                  <div key={ph.id} className="space-y-2">
                    <Label htmlFor={`field-${ph.id}`}>{ph.label}</Label>
                    <Input
                      id={`field-${ph.id}`}
                      value={formData[ph.label] || ""}
                      onChange={(e) => handleInputChange(ph.label, e.target.value)}
                      placeholder={`Enter ${ph.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

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

