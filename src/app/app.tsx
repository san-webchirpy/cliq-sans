"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import Handlebars from "handlebars"
import { Minus, Plus, Trash2 } from "lucide-react"
import React, { useState } from "react"
import { Control, Controller, useFieldArray, useForm } from "react-hook-form"
import { sendToCliq } from "./actions"

interface ProjectData {
  project: string
  tasks_completed_yesterday: string[]
  tasks_in_progress: string[]
  dependencies: string[]
  notes: string
}

interface FormData {
  projects: ProjectData[]
}

const MESSAGE_TEMPLATE = `{{#each projects}}📅Date: {{../date}}
📌Project: {{project}}
👤 Lead: SANTHOSHKUMAR
🤝 Dependency : null

{{#if tasks_completed_yesterday.length}}
✅ *Tasks Completed Yesterday:*
{{#each tasks_completed_yesterday}}
 - {{this}} 
{{/each}}
{{else}}
✅ *Tasks Completed Yesterday:* null
{{/if}}

{{#if tasks_in_progress.length}}
🚧 *Tasks in Progress Today:* 
{{#each tasks_in_progress}}
 - {{this}} 
{{/each}}
{{else}}
🚧 *Tasks in Progress Today:* null
{{/if}}

{{#if dependencies.length}}
⚠️ *Blockers / Dependencies:*
{{#each dependencies}}
 - {{this}} 
{{/each}}
{{else}}
⚠️ *Blockers / Dependencies:* null
{{/if}}

⚠️ *Blockers / Dependencies:* null

{{#if notes}}
📝 *Notes / Comments:*
 - {{notes}} 
{{else}}
📝 *Notes / Comments:* null
{{/if}}
{{#unless @last}}

-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-

{{/unless}}
{{/each}}`

const TaskFieldArray: React.FC<{
  projectIndex: number
  fieldName: keyof Pick<
    ProjectData,
    "tasks_completed_yesterday" | "tasks_in_progress" | "dependencies"
  >
  label: string
  control: any
}> = ({ projectIndex, fieldName, label, control }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `projects.${projectIndex}.${fieldName}`,
  })

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (e.currentTarget.value.trim() !== "" && index === fields.length - 1) {
        append("") // Add new empty field
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {fields.map((field, taskIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <Controller
            name={`projects.${projectIndex}.${fieldName}.${taskIndex}`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={`Enter ${label.toLowerCase().slice(0, -1)}`}
                className="flex-1"
                onKeyDown={(e) => handleKeyDown(e, taskIndex)}
              />
            )}
          />
          {fields.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => remove(taskIndex)}
              className="h-10 w-10 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

const App: React.FC = () => {
  const [submittedData, setSubmittedData] = useState<ProjectData[] | null>(null)

  const projectOptions: string[] = [
    "#WC-25-022-BrilliantOffice",
    "#WC-23-002-Benir",
  ]

  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      projects: [
        {
          project: "",
          tasks_completed_yesterday: [""],
          tasks_in_progress: [""],
          dependencies: [""],
          notes: "",
        },
      ],
    },
  })

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: "projects",
  })

  const onSubmit = (data: FormData) => {
    const cleanedData: ProjectData[] = data.projects.map((project) => ({
      ...project,
      tasks_completed_yesterday: project.tasks_completed_yesterday.filter(
        (task) => task.trim() !== ""
      ),
      tasks_in_progress: project.tasks_in_progress.filter(
        (task) => task.trim() !== ""
      ),
      dependencies: project.dependencies.filter((dep) => dep.trim() !== ""),
    }))

    setSubmittedData(cleanedData)
    const template = Handlebars.compile(MESSAGE_TEMPLATE)

    const message = template({
      date: format(new Date(), "dd/MM/yyyy"),
      projects: cleanedData,
    })

    console.log(message)
    sendToCliq(message)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Project Status Form
        </h1>
        <p className="text-gray-600 mt-2">
          Track project progress and dependencies
        </p>
      </div>

      <div className="space-y-6">
        {projectFields.map((project, projectIndex) => (
          <Card key={project.id} className="border-2 border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Project {projectIndex + 1}
                </CardTitle>
                {projectFields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProject(projectIndex)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Project
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Project</Label>
                <Controller
                  name={`projects.${projectIndex}.project`}
                  control={control}
                  rules={{ required: "Project selection is required" }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={fieldState.error ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectOptions.map((project) => (
                            <SelectItem key={project} value={project}>
                              {project}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Task Sections */}
              <TaskFieldArray
                projectIndex={projectIndex}
                fieldName="tasks_completed_yesterday"
                label="Tasks Completed Yesterday"
                control={control}
              />

              <TaskFieldArray
                projectIndex={projectIndex}
                fieldName="tasks_in_progress"
                label="Tasks In Progress"
                control={control}
              />

              <TaskFieldArray
                projectIndex={projectIndex}
                fieldName="dependencies"
                label="Dependencies"
                control={control}
              />

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Controller
                  name={`projects.${projectIndex}.notes`}
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Enter project notes..."
                      className="min-h-[80px]"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendProject({
                project: "",
                tasks_completed_yesterday: [""],
                tasks_in_progress: [""],
                dependencies: [""],
                notes: "",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Project
          </Button>

          <Button
            type="button"
            className="flex items-center gap-2 submit-button"
            onClick={handleSubmit(onSubmit)}
          >
            Submit Form
          </Button>
        </div>
      </div>

      {submittedData && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Submitted Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default App
