import { useState } from 'react'
import { Button, Input, Modal, Space } from 'antd'
import { Plus } from 'lucide-react'
import { createQuickNote } from '../../services/quickNotes'

type QuickNoteCreateModalProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function QuickNoteCreateModal({
  open,
  onClose,
  onCreated,
}: QuickNoteCreateModalProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const value = text.trim()
    if (!value) return

    setSaving(true)
    try {
      await createQuickNote(value)
      setText('')
      onCreated?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    setText('')
    onClose()
  }

  return (
    <Modal
      title="快速备忘"
      open={open}
      okText="保存备忘"
      cancelText="取消"
      confirmLoading={saving}
      onOk={submit}
      onCancel={close}
    >
      <Input.TextArea
        autoFocus
        value={text}
        rows={4}
        maxLength={500}
        showCount
        placeholder="先记下来，稍后再整理"
        aria-label="快速备忘内容"
        onChange={(event) => setText(event.target.value)}
      />
      <div className="modal-hint">
        保存后可以转为今日事项或专项模块记录。
      </div>
    </Modal>
  )
}

type TopQuickNoteButtonProps = {
  onCreated?: () => void
}

export function TopQuickNoteButton({
  onCreated,
}: TopQuickNoteButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<Plus size={17} />}
          onClick={() => setOpen(true)}
        >
          快速备忘
        </Button>
      </Space>
      <QuickNoteCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  )
}
