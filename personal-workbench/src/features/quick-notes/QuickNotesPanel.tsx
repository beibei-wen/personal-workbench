import { useState } from 'react'
import { App, Button, Input, Popconfirm, Space, Tooltip } from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Trash2, WandSparkles } from 'lucide-react'
import { db, repositories } from '../../db/database'
import { ConvertQuickNoteModal } from './ConvertQuickNoteModal'
import { ListRow, SimpleList } from '../../components/SimpleList'

export function QuickNotesPanel() {
  const { message } = App.useApp()
  const [text, setText] = useState('')
  const [convertingId, setConvertingId] = useState<string>()
  const notes = useLiveQuery(
    () =>
      db.quickNotes
        .where('status')
        .equals('open')
        .reverse()
        .sortBy('createdAt'),
    [],
  )

  const add = async () => {
    const value = text.trim()
    if (!value) return
    await repositories.quickNotes.create({ text: value, status: 'open' })
    setText('')
    message.success('备忘已保存')
  }

  return (
    <section className="quick-notes-panel">
      <div className="quick-notes-panel__composer">
        <Input.TextArea
          value={text}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="随手记下一件事"
          aria-label="快速备忘"
          onChange={(event) => setText(event.target.value)}
          onPressEnter={(event) => {
            const nativeEvent = event.nativeEvent
            if (
              !event.shiftKey &&
              !nativeEvent.isComposing &&
              nativeEvent.keyCode !== 229
            ) {
              event.preventDefault()
              void add()
            }
          }}
        />
        <Button type="primary" disabled={!text.trim()} onClick={add}>
          记录
        </Button>
      </div>

      <SimpleList
        className="quick-notes-list"
        items={notes ?? []}
        emptyText="暂无未整理备忘"
        renderItem={(note) => (
          <ListRow
            key={note.id}
            actions={
              <>
              <Tooltip title="整理到模块">
                <Button
                  type="text"
                  size="small"
                  icon={<WandSparkles size={15} />}
                  aria-label="整理到模块"
                  onClick={() => setConvertingId(note.id)}
                />
              </Tooltip>
              <Tooltip title="标记已处理">
                <Button
                  type="text"
                  size="small"
                  icon={<Check size={15} />}
                  aria-label="标记已处理"
                  onClick={() =>
                    void repositories.quickNotes.update(note.id, {
                      status: 'processed',
                    })
                  }
                />
              </Tooltip>
              <Popconfirm
                title="删除这条备忘？"
                okText="删除"
                cancelText="取消"
                onConfirm={() => repositories.quickNotes.remove(note.id)}
              >
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<Trash2 size={15} />}
                  aria-label="删除备忘"
                />
              </Popconfirm>
              </>
            }
          >
            <span className="quick-note-text">{note.text}</span>
          </ListRow>
        )}
      />

      <Space className="quick-notes-panel__footer">
        <span>未整理 {notes?.length ?? 0} 条</span>
      </Space>

      <ConvertQuickNoteModal
        noteId={convertingId}
        open={Boolean(convertingId)}
        onClose={() => setConvertingId(undefined)}
        onConverted={() => message.success('已转换并安排')}
      />
    </section>
  )
}
