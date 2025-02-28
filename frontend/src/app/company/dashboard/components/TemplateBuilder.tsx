"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Grip,
  Save,
  X,
  Sun,
  Moon,
  Type,
  Square,
  Circle,
  Triangle,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Palette,
} from "lucide-react"
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Group,
  Rect,
  Circle as KonvaCircle,
  RegularPolygon,
  Transformer,
} from "react-konva"

import { FileUpload } from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { KonvaEventObject } from "konva/lib/Node"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

// Font options
const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
]

// Shape types
type ShapeType = "text" | "rectangle" | "circle" | "triangle"

// Element interface
interface Element {
  id: string
  type: ShapeType
  label: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  rotation?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  align?: "left" | "center" | "right"
  isDragging?: boolean
  isSelected?: boolean
}

// Custom element configuration
interface CustomElementConfig {
  id: string
  type: ShapeType
  label: string
  fill?: string
  stroke?: string
}

export default function TemplateBuilder() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false)

  // File & image state
  const [file, setFile] = useState<File | null>(null)
  const [templatePreview, setTemplatePreview] = useState<string>("")
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)

  // Canvas elements
  const [elements, setElements] = useState<Element[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState<string>("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  // Canvas dimensions and scaling
  const [stageWidth, setStageWidth] = useState(800)
  const [stageHeight, setStageHeight] = useState(450)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null)

  // Custom placeholder panel state
  const [customElements, setCustomElements] = useState<CustomElementConfig[]>([])
  const [customLabel, setCustomLabel] = useState("")
  const [customType, setCustomType] = useState<ShapeType>("text")
  const [customFill, setCustomFill] = useState("#ffffff")
  const [customStroke, setCustomStroke] = useState("#000000")

  // Text formatting options
  const [fontSize, setFontSize] = useState(20)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textAlign, setTextAlign] = useState<"center" | "left" | "right">("center");
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [textColor, setTextColor] = useState("#000000")

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        // Maintain aspect ratio if we have an image, otherwise use 16:9
        const height = bgImage ? (width * bgImage.height) / bgImage.width : (width * 9) / 16

        setStageWidth(width)
        setStageHeight(height)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [bgImage])

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Convert file to base64 URL
  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          setTemplatePreview(e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [file])

  // Create Image element for Konva
  useEffect(() => {
    if (templatePreview) {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.src = templatePreview
      img.onload = () => {
        setBgImage(img)

        // Update stage dimensions based on image
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth
          const imageAspectRatio = img.width / img.height
          const height = containerWidth / imageAspectRatio

          setStageWidth(containerWidth)
          setStageHeight(height)
        }
      }
    }
  }, [templatePreview])

  // Compute scale factor and offset to center the image
  useEffect(() => {
    if (bgImage) {
      const s = Math.min(stageWidth / bgImage.width, stageHeight / bgImage.height)
      setScaleFactor(s)
      setImageOffset({
        x: (stageWidth - bgImage.width * s) / 2,
        y: (stageHeight - bgImage.height * s) / 2,
      })
    }
  }, [bgImage, stageWidth, stageHeight])

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      // Find the selected node
      const selectedNode = transformerRef.current.getStage().findOne(`#${selectedId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer().batchDraw()
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [selectedId])

  // Handle stage click
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Clicked on the stage background
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
      return
    }

    // Clicked on a transformer - do nothing
    const clickedOnTransformer = e.target.getParent()?.className === "Transformer"
    if (clickedOnTransformer) {
      return
    }

    // Find clicked item by id
    const id = e.target.id() || e.target.getParent()?.id()
    if (id) {
      setSelectedId(id)
    } else {
      setSelectedId(null)
    }
  }

  // Add a new element to the canvas
  const addElement = (type: ShapeType, x: number, y: number, label = "", options: Partial<Element> = {}) => {
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type,
      label: label || (type === "text" ? "Text" : ""),
      x,
      y,
      width: type === "text" ? 150 : type === "rectangle" ? 100 : undefined,
      height: type === "text" ? 50 : type === "rectangle" ? 50 : undefined,
      radius: type === "circle" ? 50 : undefined,
      fill: options.fill || (type === "text" ? "transparent" : "#ffffff"),
      stroke: options.stroke || "#000000",
      strokeWidth: 2,
      fontSize: type === "text" ? fontSize : undefined,
      fontFamily: type === "text" ? fontFamily : undefined,
      align: type === "text" ? textAlign : undefined,
      fontStyle: type === "text" ? `${isBold ? "bold" : "normal"} ${isItalic ? "italic" : "normal"}` : undefined,
      rotation: 0,
      isSelected: true,
    };
  
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const containerRect = e.currentTarget.getBoundingClientRect()
    const dropX = e.clientX - containerRect.left
    const dropY = e.clientY - containerRect.top
    const origX = (dropX - imageOffset.x) / scaleFactor
    const origY = (dropY - imageOffset.y) / scaleFactor
    const data = e.dataTransfer.getData("application/react-dnd")

    if (data) {
      try {
        const parsed = JSON.parse(data)
        addElement(parsed.type, origX, origY, parsed.label, {
          fill: parsed.fill,
          stroke: parsed.stroke,
        })
      } catch (err) {
        console.error("Invalid drag data", err)
      }
    }
  }

  // Update element coordinates after dragging on the canvas
  const handleElementDragEnd = (e: KonvaEventObject<DragEvent>, id: string) => {
    const newX = e.target.x()
    const newY = e.target.y()
    const origX = (newX - imageOffset.x) / scaleFactor
    const origY = (newY - imageOffset.y) / scaleFactor

    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x: origX, y: origY, isDragging: false } : el)))
  }

  // Handle element transform (resize, rotate)
  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    if (!selectedId) return

    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()

    // Reset scale and update width and height
    node.scaleX(1)
    node.scaleY(1)

    setElements((prev) =>
      prev.map((el) => {
        if (el.id === selectedId) {
          return {
            ...el,
            rotation,
            
            width: el.width ? el.width * scaleX : undefined,
            height: el.height ? el.height * scaleY : undefined,
            radius: el.radius ? el.radius * Math.max(scaleX, scaleY) : undefined,
          }
        }
        return el
      }),
    )
  }

  // Remove the rendered template (clear image, file, and canvas elements)
  const handleRemoveTemplate = () => {
    setFile(null)
    setTemplatePreview("")
    setBgImage(null)
    setElements([])
    setSelectedId(null)
  }

  // Save template to server
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
       alert("Please enter a template name")
       return;
     }
      
        
      
      if (!bgImage) {     
        alert("Please upload a template image");
        return
      }
      setSaveStatus("loading")
      

    const updatedElements = elements.map((el) => {
        if (el.type === "text") {
          return {
            id: el.id,
            type: el.type,
            label: el.label,
            x: el.x,
            y: el.y,
            width: el.width || 150,
            height: el.height || 50,
            fontSize: el.fontSize || fontSize,
            fontFamily: el.fontFamily || fontFamily,
            align: el.align || textAlign,
            fontStyle: el.fontStyle || `${isBold ? "bold" : "normal"} ${isItalic ? "italic" : "normal"}`,
            fill: el.fill || textColor,
          }
        }
    })
    

    const payload = {
      name: templateName,
      file: templatePreview,
      elements: updatedElements,
    }

    try {
      const token = localStorage.getItem("token");
      console.log(updatedElements);
      const res = await axios.post("http://localhost:3000/api/company/create-template", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log(res.data);
      
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving template:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  // Remove an element from the canvas
  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  // Add a new custom placeholder to the panel
  const handleAddCustomElement = () => {
    if (!customLabel.trim()) return

    const newCustom: CustomElementConfig = {
      id: `custom-${Date.now()}`,
      type: customType,
      label: customLabel,
      fill: customFill,
      stroke: customStroke,
    }

    setCustomElements((prev) => [...prev, newCustom])
    setCustomLabel("")
  }

  // Update text properties for selected element
  const updateSelectedElement = (updates: Partial<Element>) => {
    if (!selectedId) return

    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...updates } : el)))
  }

  // Get the currently selected element
  const selectedElement = elements.find((el) => el.id === selectedId)

  // Update text formatting controls when selection changes
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setFontSize(selectedElement.fontSize || 20)
      setFontFamily(selectedElement.fontFamily || "Arial")
      setTextAlign(selectedElement.align || "center")
      setTextColor(selectedElement.fill || "#000000")

      const fontStyle = selectedElement.fontStyle || "normal normal"
      setIsBold(fontStyle.includes("bold"))
      setIsItalic(fontStyle.includes("italic"))
    }
  }, [selectedElement])

  return (
    <div className={`grid gap-6 lg:grid-cols-[2fr,1fr] p-4 ${isDarkMode ? "dark" : ""}`}>
      {/* Left Column: Canvas / Template Preview */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-col">
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Template Preview</CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="dark:text-gray-300"
                    >
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle {isDarkMode ? "Light" : "Dark"} Mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {templatePreview && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleRemoveTemplate} className="dark:text-gray-300">
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove Template</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <CardDescription className="dark:text-gray-400">
            {templatePreview
              ? "Template rendered - Click to select elements, drag to move"
              : "Upload a template and add elements (drag from panel or click to add)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Only show FileUpload if no template has been rendered */}
            {!templatePreview && (
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Template File</Label>
                <FileUpload onFileChange={setFile} value={file} accept="image/*,application/pdf" />
              </div>
            )}

            {/* Canvas area */}
            <div
              ref={containerRef}
              className="relative border rounded-lg overflow-hidden bg-muted/50 dark:bg-gray-700/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="flex justify-center">
                <Stage
                  ref={stageRef}
                  width={stageWidth}
                  height={stageHeight}
                  onClick={handleStageClick}
                  onTap={handleStageClick}
                >
                  <Layer>
                    {/* Background image */}
                    {bgImage && (
                      <KonvaImage
                        image={bgImage}
                        x={imageOffset.x}
                        y={imageOffset.y}
                        scaleX={scaleFactor}
                        scaleY={scaleFactor}
                      />
                    )}

                    {/* Render all elements */}
                    {elements.map((el) => (
                      <Group
                        key={el.id}
                        id={el.id}
                        x={imageOffset.x + el.x * scaleFactor}
                        y={imageOffset.y + el.y * scaleFactor}
                        draggable
                        rotation={el.rotation}
                        onDragStart={() => {
                          setSelectedId(el.id)
                          setElements((prev) =>
                            prev.map((item) => (item.id === el.id ? { ...item, isDragging: true } : item)),
                          )
                        }}
                        onDragEnd={(e) => handleElementDragEnd(e, el.id)}
                        onTransformEnd={handleTransformEnd}
                      >
                        {el.type === "text" ? (
                          <Text
                            text={el.label}
                            fontSize={el.fontSize}
                            fontFamily={el.fontFamily}
                            fill={el.fill}
                            align={el.align}
                            width={el.width || 150}
                            height={el.height}
                            fontStyle={el.fontStyle}
                            padding={5}
                          />
                        ) : el.type === "rectangle" ? (
                          <Rect
                            width={el.width}
                            height={el.height}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                            cornerRadius={5}
                          />
                        ) : el.type === "circle" ? (
                          <KonvaCircle
                            radius={el.radius}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        ) : el.type === "triangle" ? (
                          <RegularPolygon
                            sides={3}
                            radius={el.radius ?? 50}
                            fill={el.fill}
                            stroke={el.stroke}
                            strokeWidth={el.strokeWidth}
                          />
                        ) : null}
                      </Group>
                    ))}

                    {/* Transformer for resizing and rotating elements */}
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size
                        if (newBox.width < 10 || newBox.height < 10) {
                          return oldBox
                        }
                        return newBox
                      }}
                    />
                  </Layer>
                </Stage>
              </div>
            </div>

            {/* Element formatting toolbar - only show when an element is selected */}
            {selectedId && (
              <div className="p-2 border rounded-lg bg-muted/50 dark:bg-gray-700/50 dark:border-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Text formatting options - only show for text elements */}
                  {selectedElement?.type === "text" && (
                    <>
                      <Select
                        value={fontFamily}
                        onValueChange={(value) => {
                          setFontFamily(value)
                          updateSelectedElement({ fontFamily: value })
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue placeholder="Font" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isBold ? "bg-muted" : ""} dark:text-gray-300`}
                          onClick={() => {
                            const newBold = !isBold
                            setIsBold(newBold)
                            const newStyle = `${newBold ? "bold" : "normal"} ${isItalic ? "italic" : "normal"}`
                            updateSelectedElement({ fontStyle: newStyle })
                          }}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${isItalic ? "bg-muted" : ""} dark:text-gray-300`}
                          onClick={() => {
                            const newItalic = !isItalic
                            setIsItalic(newItalic)
                            const newStyle = `${isBold ? "bold" : "normal"} ${newItalic ? "italic" : "normal"}`
                            updateSelectedElement({ fontStyle: newStyle })
                          }}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>

                        <div className="flex border rounded-md overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-none ${textAlign === "left" ? "bg-muted" : ""} dark:text-gray-300`}
                            onClick={() => {
                              setTextAlign("left")
                              updateSelectedElement({ align: "left" })
                            }}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-none ${textAlign === "center" ? "bg-muted" : ""} dark:text-gray-300`}
                            onClick={() => {
                              setTextAlign("center")
                              updateSelectedElement({ align: "center" })
                            }}
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-none ${textAlign === "right" ? "bg-muted" : ""} dark:text-gray-300`}
                            onClick={() => {
                              setTextAlign("right")
                              updateSelectedElement({ align: "right" })
                            }}
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs dark:text-gray-300">Size:</Label>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 dark:text-gray-300"
                            onClick={() => {
                              const newSize = Math.max(8, fontSize - 2)
                              setFontSize(newSize)
                              updateSelectedElement({ fontSize: newSize })
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="w-8 text-center text-sm dark:text-gray-300">{fontSize}</span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 dark:text-gray-300"
                            onClick={() => {
                              const newSize = Math.min(72, fontSize + 2)
                              setFontSize(newSize)
                              updateSelectedElement({ fontSize: newSize })
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color picker for all elements */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 flex items-center gap-1 dark:text-gray-300 dark:border-gray-600"
                      >
                        <Palette className="h-4 w-4" />
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{
                            backgroundColor:
                              selectedElement?.type === "text" ? selectedElement.fill : selectedElement?.fill,
                          }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 dark:bg-gray-800 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">
                          {selectedElement?.type === "text" ? "Text Color" : "Fill Color"}
                        </Label>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            "#000000",
                            "#ffffff",
                            "#ff0000",
                            "#00ff00",
                            "#0000ff",
                            "#ffff00",
                            "#ff00ff",
                            "#00ffff",
                            "#ff9900",
                            "#9900ff",
                            "#009900",
                            "#990000",
                          ].map((color) => (
                            <div
                              key={color}
                              className={`w-8 h-8 rounded-full border cursor-pointer ${
                                (
                                  selectedElement?.type === "text"
                                    ? selectedElement.fill === color
                                    : selectedElement?.fill === color
                                )
                                  ? "ring-2 ring-offset-2 ring-primary"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                if (selectedElement?.type === "text") {
                                  setTextColor(color)
                                }
                                updateSelectedElement({ fill: color })
                              }}
                            />
                          ))}
                        </div>

                        {selectedElement?.type !== "text" && (
                          <>
                            <Label className="mt-3 dark:text-gray-300">Stroke Color</Label>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                "#000000",
                                "#ffffff",
                                "#ff0000",
                                "#00ff00",
                                "#0000ff",
                                "#ffff00",
                                "#ff00ff",
                                "#00ffff",
                                "#ff9900",
                                "#9900ff",
                                "#009900",
                                "#990000",
                              ].map((color) => (
                                <div
                                  key={color}
                                  className={`w-8 h-8 rounded-full border cursor-pointer ${
                                    selectedElement?.stroke === color ? "ring-2 ring-offset-2 ring-primary" : ""
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    updateSelectedElement({ stroke: color })
                                  }}
                                />
                              ))}
                            </div>

                            <Label className="mt-3 dark:text-gray-300">Stroke Width</Label>
                            <Slider
                              value={[selectedElement?.strokeWidth || 2]}
                              min={0}
                              max={10}
                              step={1}
                              onValueChange={(value) => {
                                updateSelectedElement({ strokeWidth: value[0] })
                              }}
                            />
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto dark:text-gray-300"
                    onClick={() => removeElement(selectedId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Template Details & Custom Placeholder Panel */}
      <div className="flex flex-col gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Template Details</CardTitle>
            <CardDescription className="dark:text-gray-400">Configure your template settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name" className="dark:text-gray-300">
                  Template Name
                </Label>
                <Input
                  id="template-name"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-300">Elements on Canvas</Label>
                {elements.length === 0 ? (
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    No elements added yet. Click or drop an element on the template.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {elements.map((el) => (
                      <div
                        key={el.id}
                        className={`flex items-center gap-2 p-2 rounded-md border 
                          ${
                            selectedId === el.id
                              ? "bg-primary/10 border-primary"
                              : "bg-muted/50 border-border dark:bg-gray-700 dark:border-gray-600"
                          } 
                          cursor-pointer`}
                        onClick={() => setSelectedId(el.id)}
                      >
                        <Grip className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        {el.type === "text" ? (
                          <Input
                            value={el.label}
                            onChange={(e) =>
                              setElements((prev) =>
                                prev.map((item) => (item.id === el.id ? { ...item, label: e.target.value } : item)),
                              )
                            }
                            className="h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="dark:text-gray-300">{el.label || el.type}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeElement(el.id)
                          }}
                          className="dark:text-gray-300"
                        >
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
              className="w-full dark:bg-primary dark:text-primary-foreground"
            >
              {saveStatus === "loading" ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Design Elements Panel */}
        <Tabs defaultValue="shapes" className="w-full">
          <TabsList className="w-full dark:bg-gray-700">
            <TabsTrigger value="shapes" className="flex-1 dark:text-gray-300 dark:data-[state=active]:bg-gray-600">
              Shapes
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 dark:text-gray-300 dark:data-[state=active]:bg-gray-600">
              Custom
            </TabsTrigger>
          </TabsList>

          {/* Shapes Tab */}
          <TabsContent value="shapes" className="p-4 border rounded-lg mt-2 dark:bg-gray-800 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-move hover:bg-muted/50 dark:border-gray-600 dark:hover:bg-gray-700"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/react-dnd", JSON.stringify({ type: "text", label: "Text" }))
                }
              >
                <Type className="h-6 w-6 dark:text-gray-300" />
                <span className="text-sm dark:text-gray-300">Text</span>
              </div>

              <div
                className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-move hover:bg-muted/50 dark:border-gray-600 dark:hover:bg-gray-700"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/react-dnd", JSON.stringify({ type: "rectangle", label: "" }))
                }
              >
                <Square className="h-6 w-6 dark:text-gray-300" />
                <span className="text-sm dark:text-gray-300">Rectangle</span>
              </div>

              <div
                className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-move hover:bg-muted/50 dark:border-gray-600 dark:hover:bg-gray-700"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/react-dnd", JSON.stringify({ type: "circle", label: "" }))
                }
              >
                <Circle className="h-6 w-6 dark:text-gray-300" />
                <span className="text-sm dark:text-gray-300">Circle</span>
              </div>

              <div
                className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-move hover:bg-muted/50 dark:border-gray-600 dark:hover:bg-gray-700"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/react-dnd", JSON.stringify({ type: "triangle", label: "" }))
                }
              >
                <Triangle className="h-6 w-6 dark:text-gray-300" />
                <span className="text-sm dark:text-gray-300">Triangle</span>
              </div>
            </div>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="p-4 border rounded-lg mt-2 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor="custom-label" className="dark:text-gray-300">
                  Placeholder Label
                </Label>
                <Input
                  id="custom-label"
                  placeholder="Enter placeholder label"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-type" className="dark:text-gray-300">
                  Type
                </Label>
                <Select onValueChange={(value) => setCustomType(value as ShapeType)} value={customType}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Fill Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md border cursor-pointer" style={{ backgroundColor: customFill }} />
                    <Input
                      type="color"
                      value={customFill}
                      onChange={(e) => setCustomFill(e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Stroke Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md border cursor-pointer"
                      style={{ backgroundColor: customStroke }}
                    />
                    <Input
                      type="color"
                      value={customStroke}
                      onChange={(e) => setCustomStroke(e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleAddCustomElement} className="mt-2 dark:bg-primary dark:text-primary-foreground">
                Add Custom Element
              </Button>

              <div className="mt-2">
                <Label className="dark:text-gray-300">Custom Elements</Label>
                <div className="grid gap-2 mt-2 max-h-[150px] overflow-y-auto pr-2">
                  {customElements.length === 0 ? (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      No custom elements added. Use the form above to add one.
                    </p>
                  ) : (
                    customElements.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 border rounded cursor-move flex items-center justify-between dark:border-gray-600 dark:bg-gray-700"
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData(
                            "application/react-dnd",
                            JSON.stringify({
                              type: item.type,
                              label: item.label,
                              fill: item.fill,
                              stroke: item.stroke,
                            }),
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-sm"
                            style={{
                              backgroundColor: item.fill,
                              border: `1px solid ${item.stroke}`,
                            }}
                          />
                          <span className="dark:text-gray-300">
                            {item.label} ({item.type})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 dark:text-gray-300"
                          onClick={() => setCustomElements((prev) => prev.filter((el) => el.id !== item.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {saveStatus === "success" && (
        <Alert
          variant="success"
          className="fixed bottom-4 right-4 w-auto max-w-md dark:bg-green-900 dark:border-green-800"
        >
          <AlertDescription className="dark:text-white">Template saved successfully!</AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto max-w-md">
          <AlertDescription>Failed to save template.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

