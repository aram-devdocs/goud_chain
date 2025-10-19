import { useState, useEffect } from 'react'
import { useSubmitData, useToast } from '@goudchain/hooks'
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@goudchain/ui'
import { ButtonVariant, ButtonSize } from '@goudchain/types'
import { encryptData } from '@goudchain/utils'

interface Field {
  id: string
  key: string
  type: 'string' | 'number' | 'boolean'
  value: string | number | boolean
}

export default function SubmitPage() {
  const [label, setLabel] = useState('')
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form')
  const [formFields, setFormFields] = useState<Field[]>([])
  const [jsonData, setJsonData] = useState('')
  const [jsonPreview, setJsonPreview] = useState('{}')
  const [jsonValid, setJsonValid] = useState(true)

  const { success, error } = useToast()
  const submitMutation = useSubmitData()

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
      // Switching from form to JSON
      setJsonData(jsonPreview)
    } else if (mode === 'form' && inputMode === 'json') {
      // Switching from JSON to form
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
        error('Invalid JSON format')
        return
      }
    }
    setInputMode(mode)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
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

    try {
      // Get data from appropriate mode
      const dataToSubmit = inputMode === 'form' ? jsonPreview : jsonData

      await submitMutation.mutateAsync({
        label: label.trim(),
        data: dataToSubmit,
      })

      success('Data submitted successfully')

      // Reset form
      setLabel('')
      setFormFields([])
      setJsonData('')
      setJsonPreview('{}')
    } catch (err) {
      error((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Submit Data</h2>
        <p className="text-zinc-500">
          Encrypt and submit data to the blockchain
        </p>
      </div>

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
                  <div className="bg-zinc-800/50 rounded-lg p-6 text-center text-zinc-400 text-sm">
                    No fields yet. Click "Add Field" to get started.
                  </div>
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
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(field.id, {
                              type: e.target.value as Field['type'],
                              value:
                                e.target.value === 'boolean' ? 'false' : '',
                            })
                          }
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                        >
                          <option value="string">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                        </select>
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
                          <select
                            value={String(field.value)}
                            onChange={(e) =>
                              updateField(field.id, { value: e.target.value })
                            }
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        )}
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="text-red-400 hover:text-red-300 text-lg font-bold"
                        >
                          ×
                        </button>
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
                        <button
                          type="button"
                          onClick={() => copyToClipboard(jsonPreview)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Copy
                        </button>
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
              <div>
                <Label htmlFor="jsonData">JSON Data</Label>
                <textarea
                  id="jsonData"
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='{"key": "value", "another": 42}'
                  rows={12}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-zinc-500">
                    Enter any valid JSON object
                  </p>
                  {jsonData && (
                    <span
                      className={`text-xs ${jsonValid ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {jsonValid ? 'Valid JSON' : 'Invalid JSON'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid() || submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
