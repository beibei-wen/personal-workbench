import { useEffect } from 'react'
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
} from 'antd'
import dayjs from 'dayjs'

export type FormField = {
  name: string
  label: string
  input:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'date'
    | 'time'
    | 'switch'
  options?: Array<{ label: string; value: string | number }>
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  rows?: number
  span?: number
}

type FormDrawerProps = {
  open: boolean
  title: string
  fields: FormField[]
  initialValues?: Record<string, unknown>
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
}

function toFormValues(
  values: Record<string, unknown>,
  fields: FormField[],
) {
  const result = { ...values }

  for (const field of fields) {
    const value = values[field.name]
    if (field.input === 'date' && typeof value === 'string' && value) {
      result[field.name] = dayjs(value)
    }
    if (field.input === 'time' && typeof value === 'string' && value) {
      result[field.name] = dayjs(value, 'HH:mm')
    }
  }

  return result
}

function toOutputValues(
  values: Record<string, unknown>,
  fields: FormField[],
) {
  const result = { ...values }

  for (const field of fields) {
    const value = values[field.name]
    if (field.input === 'date' && dayjs.isDayjs(value)) {
      result[field.name] = value.format('YYYY-MM-DD')
    }
    if (field.input === 'time' && dayjs.isDayjs(value)) {
      result[field.name] = value.format('HH:mm')
    }
  }

  return result
}

function OpenFormDrawer({
  open,
  title,
  fields,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}: FormDrawerProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(toFormValues(initialValues ?? {}, fields))
    } else {
      form.resetFields()
    }
  }, [fields, form, initialValues, open])

  return (
    <Drawer
      title={title}
      open={open}
      size="large"
      destroyOnHidden
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values: Record<string, unknown>) =>
          onSubmit(toOutputValues(values, fields))
        }
      >
        <Row gutter={16}>
          {fields.map((field) => (
            <Col span={field.span ?? 24} key={field.name}>
              <Form.Item
                name={field.name}
                label={field.label}
                valuePropName={field.input === 'switch' ? 'checked' : 'value'}
                rules={
                  field.required
                    ? [{ required: true, message: `请填写${field.label}` }]
                    : undefined
                }
              >
                {field.input === 'textarea' ? (
                  <Input.TextArea
                    rows={field.rows ?? 4}
                    placeholder={field.placeholder}
                  />
                ) : field.input === 'number' ? (
                  <InputNumber
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder}
                    style={{ width: '100%' }}
                  />
                ) : field.input === 'select' ? (
                  <Select
                    options={field.options}
                    placeholder={field.placeholder}
                    allowClear
                  />
                ) : field.input === 'date' ? (
                  <DatePicker
                    placeholder={field.placeholder}
                    style={{ width: '100%' }}
                  />
                ) : field.input === 'time' ? (
                  <TimePicker
                    format="HH:mm"
                    placeholder={field.placeholder}
                    style={{ width: '100%' }}
                  />
                ) : field.input === 'switch' ? (
                  <Switch />
                ) : (
                  <Input placeholder={field.placeholder} />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Form>
    </Drawer>
  )
}

export function FormDrawer(props: FormDrawerProps) {
  if (!props.open) {
    return null
  }

  return <OpenFormDrawer {...props} />
}
