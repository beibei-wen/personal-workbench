import { useEffect } from 'react'
import {
  DatePicker,
  Form,
  Modal,
  Select,
} from 'antd'
import dayjs from 'dayjs'
import type { Priority } from '../../domain/types'
import {
  convertQuickNote,
  quickNoteTargetLabels,
  type QuickNoteTarget,
} from '../../services/quickNotes'

type ConvertQuickNoteModalProps = {
  noteId?: string
  open: boolean
  onClose: () => void
  onConverted?: () => void
}

type ConvertValues = {
  target: QuickNoteTarget
  plannedDate: dayjs.Dayjs
  priority: Priority
}

export function ConvertQuickNoteModal({
  noteId,
  open,
  onClose,
  onConverted,
}: ConvertQuickNoteModalProps) {
  const [form] = Form.useForm<ConvertValues>()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        target: 'today',
        plannedDate: dayjs(),
        priority: 'medium',
      })
    } else {
      form.resetFields()
    }
  }, [form, open])

  const submit = async () => {
    const values = await form.validateFields()
    if (!noteId) return

    await convertQuickNote(
      noteId,
      values.target,
      values.plannedDate.format('YYYY-MM-DD'),
      values.priority,
    )
    onConverted?.()
    onClose()
  }

  return (
    <Modal
      title="整理快速备忘"
      open={open}
      forceRender
      okText="转换"
      cancelText="取消"
      onOk={submit}
      onCancel={onClose}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="target"
          label="转换为"
          rules={[{ required: true }]}
        >
          <Select
            options={Object.entries(quickNoteTargetLabels).map(
              ([value, label]) => ({ value, label }),
            )}
          />
        </Form.Item>
        <Form.Item
          name="plannedDate"
          label="安排日期"
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
