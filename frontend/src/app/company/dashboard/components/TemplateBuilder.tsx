"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Grip, Save, X } from "lucide-react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Group,
  Rect,
} from "react-konva";

import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KonvaEventObject } from "konva/lib/Node";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Element {
  id: string;
  type: "text" | "rectangle";
  label: string;
  x: number; // stored relative to original image
  y: number;
  width?: number;
  height?: number;
}

interface CustomElementConfig {
  id: string;
  type: "text" | "rectangle";
  label: string;
}

export default function TemplateBuilder() {
  // File & image state
  const [file, setFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string>("");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Canvas elements
  const [elements, setElements] = useState<Element[]>([]);
  const [templateName, setTemplateName] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Container and scaling values (16:9 canvas)
  const containerWidth = 800;
  const containerHeight = 450;
  const [scaleFactor, setScaleFactor] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  // Custom placeholder panel state
  const [customElements, setCustomElements] = useState<CustomElementConfig[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState<"text" | "rectangle">("text");

  // Convert file to base64 URL
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          setTemplatePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  // Create Image element for Konva
  useEffect(() => {
    if (templatePreview) {
      const img = new window.Image();
      img.src = templatePreview;
      img.onload = () => setBgImage(img);
    }
  }, [templatePreview]);

  // Compute scale factor and offset to center the image in the 16:9 container.
  useEffect(() => {
    if (bgImage) {
      const s = Math.min(containerWidth / bgImage.width, containerHeight / bgImage.height);
      setScaleFactor(s);
      setImageOffset({
        x: (containerWidth - bgImage.width * s) / 2,
        y: (containerHeight - bgImage.height * s) / 2,
      });
    }
  }, [bgImage, containerWidth, containerHeight]);

  // Clicking on the canvas (outside any element) creates a default text element.
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        const origX = (pos.x - imageOffset.x) / scaleFactor;
        const origY = (pos.y - imageOffset.y) / scaleFactor;
        const newElement: Element = {
          id: `element-${Date.now()}`,
          type: "text",
          label: "Text",
          x: origX,
          y: origY,
        };
        setElements((prev) => [...prev, newElement]);
      }
    }
  };

  // Handle drop event from custom placeholder panel onto canvas.
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const containerRect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - containerRect.left;
    const dropY = e.clientY - containerRect.top;
    const origX = (dropX - imageOffset.x) / scaleFactor;
    const origY = (dropY - imageOffset.y) / scaleFactor;
    const data = e.dataTransfer.getData("application/react-dnd");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const newElement: Element = {
          id: `element-${Date.now()}`,
          type: parsed.type,
          label: parsed.label,
          x: origX,
          y: origY,
          width: parsed.type === "rectangle" ? 100 : undefined,
          height: parsed.type === "rectangle" ? 50 : undefined,
        };
        setElements((prev) => [...prev, newElement]);
      } catch (err) {
        console.error("Invalid drag data", err);
      }
    }
  };

  // Update element coordinates after dragging on the canvas.
  const handleElementDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
    const newX = e.target.x();
    const newY = e.target.y();
    const origX = (newX - imageOffset.x) / scaleFactor;
    const origY = (newY - imageOffset.y) / scaleFactor;
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x: origX, y: origY } : el))
    );
  };

  // Remove the rendered template (clear image, file, and canvas elements)
  const handleRemoveTemplate = () => {
    setFile(null);
    setTemplatePreview("");
    setBgImage(null);
    setElements([]);
  };

  // Save template to server.
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    setSaveStatus("loading");
    const payload = {
      name: templateName,
      file: templatePreview,
      elements,
    };
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/company/template", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving template:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // Remove an element from the canvas.
  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  // Add a new custom placeholder to the panel.
  const handleAddCustomElement = () => {
    if (!customLabel.trim()) return;
    const newCustom: CustomElementConfig = {
      id: `custom-${Date.now()}`,
      type: customType,
      label: customLabel,
    };
    setCustomElements((prev) => [...prev, newCustom]);
    setCustomLabel("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      {/* Left Column: Canvas / Template Preview */}
      <Card>
        <CardHeader className="flex flex-col">
          <div className="flex items-center gap-2">
            <CardTitle>Template Preview</CardTitle>
            {templatePreview && (
              <Button variant="ghost" size="icon" onClick={handleRemoveTemplate}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove Template</span>
              </Button>
            )}
          </div>
          <CardDescription>
            {templatePreview
              ? "Template rendered"
              : "Upload a template and add elements (drag from panel or click to add)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Only show FileUpload if no template has been rendered */}
            {!templatePreview && (
              <div className="space-y-2">
                <Label>Template File</Label>
                <FileUpload
                  onFileChange={setFile}
                  value={file}
                  accept="image/*,application/pdf"
                />
              </div>
            )}
            {templatePreview && (
              <div
                className="relative border rounded-lg overflow-hidden bg-muted/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {/* Wrap Stage in a flex container to center it */}
                <div className="flex justify-center">
                  <Stage
                    width={containerWidth}
                    height={containerHeight}
                    onClick={handleStageClick}
                  >
                    <Layer>
                      {bgImage && (
                        <KonvaImage
                          image={bgImage}
                          x={imageOffset.x}
                          y={imageOffset.y}
                          scaleX={scaleFactor}
                          scaleY={scaleFactor}
                        />
                      )}
                      {elements.map((el) => (
                        <Group
                          key={el.id}
                          x={imageOffset.x + el.x * scaleFactor}
                          y={imageOffset.y + el.y * scaleFactor}
                          draggable
                          onDragEnd={(e) => handleElementDragEnd(e, el.id)}
                        >
                          {el.type === "text" ? (
                            // Render text element with a border rectangle behind it.
                            <Group>
                              <Rect
                                width={150}
                                height={40}
                                fill="#ffffff"
                                stroke="black"
                                strokeWidth={2}
                              />
                              <Text
                                text={el.label}
                                fontSize={20}
                                fill="black"
                                width={150}
                                align="center"
                                verticalAlign="middle"
                                y={10}
                                fontFamily="Tomorrow"
                              />
                            </Group>
                          ) : el.type === "rectangle" ? (
                            <>
                              <Rect
                                width={el.width || 100}
                                height={el.height || 50}
                                fill="transparent"
                                stroke="black"
                                strokeWidth={2}
                              />
                              <Text text={el.label} fontSize={14} fill="black" x={5} y={5} />
                            </>
                          ) : null}
                        </Group>
                      ))}
                    </Layer>
                  </Stage>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Template Details & Custom Placeholder Panel */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Configure your template settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Elements on Canvas</Label>
                {elements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No elements added yet. Click or drop an element on the template.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {elements.map((el) => (
                      <div key={el.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                        <Grip className="h-4 w-4 text-muted-foreground" />
                        {el.type === "text" ? (
                          <Input
                            value={el.label}
                            onChange={(e) =>
                              setElements((prev) =>
                                prev.map((item) =>
                                  item.id === el.id ? { ...item, label: e.target.value } : item
                                )
                              )
                            }
                            className="h-8"
                          />
                        ) : (
                          <span>{el.label}</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => removeElement(el.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveTemplate}
              disabled={saveStatus === "loading" || elements.length === 0 || !templateName}
              className="w-full"
            >
              {saveStatus === "loading" ? "Saving..." : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Custom Placeholder Panel */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="mb-2 font-medium">Placeholder Panel</p>
          {/* Form to add a new custom placeholder */}
          <div className="flex flex-col gap-2 mb-4">
            <Label htmlFor="custom-label">Placeholder Label</Label>
            <Input
              id="custom-label"
              placeholder="Enter placeholder label"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
            />
            <Label htmlFor="custom-type">Type</Label>
            <Select onValueChange={(value) => setCustomType(value as "text" | "rectangle")} value={customType}>
                <SelectTrigger className="w-max sm:w-max md:w-max">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleAddCustomElement} className="mt-2">
              Add Placeholder
            </Button>
          </div>
          {/* List of custom placeholders as draggable items */}
          <div className="flex flex-col gap-2">
            {customElements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom placeholders added. Use the form above to add one.
              </p>
            ) : (
              customElements.map((item) => (
                <div
                  key={item.id}
                  className="p-2 border rounded cursor-move  text-slate-200 bg-black text-center dark:text-slate-800 dark:bg-white"
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "application/react-dnd",
                      JSON.stringify({ type: item.type, label: item.label })
                    )
                  }
                >
                  {item.label} ({item.type})
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {saveStatus === "success" && (
        <Alert variant="success" className="fixed bottom-4 right-4">
          <AlertDescription>Template saved successfully!</AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert variant="destructive" className="fixed bottom-4 right-4">
          <AlertDescription>Failed to save template.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
