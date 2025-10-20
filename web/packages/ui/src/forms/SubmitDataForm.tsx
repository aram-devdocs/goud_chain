import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
  ButtonGroup,
} from '../index'
import { ButtonVariant, ButtonSize } from '@goudchain/types'

interface Field {
  id: string
  key: string
  type: 'string' | 'number' | 'boolean'
  value: string | number | boolean
}

export interface SubmitDataFormProps {
  onSubmit: (data: { label: string; jsonData: string }) => Promise<void>
  onCopyToClipboard?: (text: string) => void
  isLoading?: boolean
  initialLabel?: string
  initialData?: string
}

export function SubmitDataForm({
  onSubmit,
  onCopyToClipboard,
  isLoading = false,
  initialLabel = '',
  initialData = '',
}: SubmitDataFormProps) {
  const [label, setLabel] = useState(initialLabel)
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form')
  const [formFields, setFormFields] = useState<Field[]>([])
  const [jsonData, setJsonData] = useState(initialData)
  const [jsonPreview, setJsonPreview] = useState('{}')
  const [jsonValid, setJsonValid] = useState(true)

  // Update JSON preview when form fields change
  useEffect(() => {
    if (inputMode === 'form') {
      updateJSONFromForm()
    }
  }, [formFields, inputMode])

  // Validate JSON when user types in JSON mode
  useEffect(() => {
    if (inputMode === 'json' && jsonData) {
      try {
        JSON.parse(jsonData)
        setJsonValid(true)
      } catch {
        setJsonValid(false)
      }
    }
  }, [jsonData, inputMode])

  const addField = () => {
    const newField: Field = {
      id: crypto.randomUUID(),
      key: '',
      type: 'string',
      value: '',
    }
    setFormFields([...formFields, newField])
  }

  const removeField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<Field>) => {
    setFormFields(
      formFields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    )
  }

  const updateJSONFromForm = () => {
    const obj = formFields.reduce(
      (acc, field) => {
        if (field.key) {
          acc[field.key] =
            field.type === 'number'
              ? Number(field.value)
              : field.type === 'boolean'
                ? field.value === 'true' || field.value === true
                : field.value
        }
        return acc
      },
      {} as Record<string, any>
    )
    setJsonPreview(JSON.stringify(obj, null, 2))
  }

  const switchMode = (mode: 'form' | 'json') => {
    if (mode === 'json' && inputMode === 'form') {
      setJsonData(jsonPreview)
    } else if (mode === 'form' && inputMode === 'json') {
      try {
        const parsed = JSON.parse(jsonData)
        const fields: Field[] = Object.entries(parsed).map(([key, value]) => ({
          id: crypto.randomUUID(),
          key,
          type:
            typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
                ? 'boolean'
                : ('string' as const),
          value: value as string | number | boolean,
        }))
        setFormFields(fields)
      } catch {
        return
      }
    }
    setInputMode(mode)
  }

  const copyToClipboard = (text: string) => {
    if (onCopyToClipboard) {
      onCopyToClipboard(text)
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const isFormValid = () => {
    if (!label || label.length > 100) return false
    if (inputMode === 'form') {
      return formFields.length > 0 && formFields.every((f) => f.key)
    } else {
      return jsonData && jsonValid
    }
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    const dataToSubmit = inputMode === 'form' ? jsonPreview : jsonData

    await onSubmit({
      label: label.trim(),
      jsonData: dataToSubmit,
    })

    // Reset form
    setLabel('')
    setFormFields([])
    setJsonData('')
    setJsonPreview('{}')
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Encrypted Data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection Label */}
          <div>
            <Label htmlFor="label">Collection Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLabel(e.target.value)
              }
              placeholder="e.g., medical-records (max 100 chars)"
              required
              maxLength={100}
              className="mt-1"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Human-readable name for this collection ({label.length}/100
              characters)
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Mode:</span>
            <ButtonGroup direction="horizontal" spacing="tight">
              <Button
                type="button"
                variant={
                  inputMode === 'form'
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                size={ButtonSize.Small}
                onClick={() => switchMode('form')}
              >
                Form
              </Button>
              <Button
                type="button"
                variant={
                  inputMode === 'json'
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                size={ButtonSize.Small}
                onClick={() => switchMode('json')}
              >
                JSON
              </Button>
            </ButtonGroup>
          </div>

          {/* Form Builder Mode */}
          {inputMode === 'form' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Data Fields</Label>
                <Button
                  type="button"
                  onClick={addField}
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Small}
                >
                  + Add Field
                </Button>
              </div>

              {formFields.length === 0 && (
                <EmptyState
                  title="No fields yet"
                  description='Click "Add Field" to get started.'
                />
              )}

              {formFields.map((field) => (
                <div key={field.id} className="bg-zinc-800 rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Key Input */}
                    <div className="col-span-4">
                      <Input
                        value={field.key}
                        onChange={(e) =>
                          updateField(field.id, { key: e.target.value })
                        }
                        placeholder="Key"
                        className="bg-zinc-700 border-zinc-600"
                      />
                    </div>

                    {/* Type Select */}
                    <div className="col-span-2">
                      <Select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, {
                            type: e.target.value as Field['type'],
                            value: e.target.value === 'boolean' ? 'false' : '',
                          })
                        }
                        className="bg-zinc-700 border-zinc-600"
                      >
                        <option value="string">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div className="col-span-5">
                      {field.type !== 'boolean' ? (
                        <Input
                          value={String(field.value)}
                          type={field.type === 'number' ? 'number' : 'text'}
                          onChange={(e) =>
                            updateField(field.id, { value: e.target.value })
                          }
                          placeholder="Value"
                          className="bg-zinc-700 border-zinc-600"
                        />
                      ) : (
                        <Select
                          value={String(field.value)}
                          onChange={(e) =>
                            updateField(field.id, { value: e.target.value })
                          }
                          className="bg-zinc-700 border-zinc-600"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </Select>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        type="button"
                        onClick={() => removeField(field.id)}
                        variant={ButtonVariant.Danger}
                        size={ButtonSize.Small}
                        className="text-lg"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* JSON Preview */}
              {formFields.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs text-zinc-400">
                        Preview
                      </CardTitle>
                      <Button
                        type="button"
                        onClick={() => copyToClipboard(jsonPreview)}
                        variant={ButtonVariant.Ghost}
                        size={ButtonSize.Small}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      {jsonPreview}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Raw JSON Mode */}
          {inputMode === 'json' && (
            <Textarea
              id="jsonData"
              label="JSON Data"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='{"key": "value", "another": 42}'
              rows={12}
              fullWidth
              error={
                jsonData && !jsonValid
                  ? 'Invalid JSON - check syntax'
                  : undefined
              }
              helperText={
                jsonData && jsonValid
                  ? 'Valid JSON format'
                  : !jsonData
                    ? 'Enter any valid JSON object'
                    : undefined
              }
              className="font-mono text-sm"
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid() || isLoading}
            loading={isLoading}
          >
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
