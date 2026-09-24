import { useRef, useState } from 'react'
import {
  App,
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Typography,
} from 'antd'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Download,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { db } from '../../db/database'
import {
  createBackup,
  downloadBackup,
  parseBackupText,
  restoreBackup,
  type BackupFile,
} from '../../services/backup'

async function getTableCounts() {
  const entries = await Promise.all(
    db.tables.map(async (table) => [table.name, await table.count()] as const),
  )
  return Object.fromEntries(entries)
}

export function BackupPage() {
  const { message, modal } = App.useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<BackupFile>()
  const [restoring, setRestoring] = useState(false)
  const counts = useLiveQuery(() => getTableCounts(), [])
  const totalRecords = Object.values(counts ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  )

  const exportData = async () => {
    const backup = await createBackup()
    const fileName = downloadBackup(backup)
    message.success(`备份已导出：${fileName}`)
  }

  const chooseBackup = () => {
    fileInputRef.current?.click()
  }

  const previewFile = async (file: File) => {
    try {
      const text = await file.text()
      const backup = await parseBackupText(text)
      setPreview(backup)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '无法读取备份文件',
      )
    }
  }

  const confirmRestore = async () => {
    if (!preview) return
    setRestoring(true)
    try {
      await restoreBackup(preview)
      setPreview(undefined)
      message.success('备份已恢复，当前数据已完整替换')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '恢复失败，当前数据未改变',
      )
    } finally {
      setRestoring(false)
    }
  }

  const askRestore = () => {
    modal.confirm({
      title: '确认恢复并替换当前数据？',
      content:
        '恢复会清空当前所有模块数据并写入备份内容。此操作不会自动合并。',
      okText: '确认恢复',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: confirmRestore,
    })
  }

  return (
    <section className="page">
      <PageHeader
        title="数据与备份"
        description="应用数据保存在这台电脑的浏览器中，可手动导出完整备份并在需要时恢复。"
      />

      <div className="backup-hero">
        <Card>
          <HardDrive size={26} />
          <div>
            <Typography.Title level={4}>当前本地数据</Typography.Title>
            <Typography.Text type="secondary">
              共 {totalRecords} 条记录，覆盖 {Object.keys(counts ?? {}).length}{' '}
              张数据表
            </Typography.Text>
          </div>
        </Card>
        <Card>
          <ShieldCheck size={26} />
          <div>
            <Typography.Title level={4}>备份文件</Typography.Title>
            <Typography.Text type="secondary">
              不上传、不同步，只下载到你选择的本机位置
            </Typography.Text>
          </div>
        </Card>
      </div>

      <div className="backup-actions">
        <Card title="导出完整备份" size="small">
          <Typography.Paragraph type="secondary">
            导出所有模块、今日计划、快速备忘、设置和数据结构版本。
          </Typography.Paragraph>
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={() => void exportData()}
          >
            导出备份
          </Button>
        </Card>

        <Card title="从备份恢复" size="small">
          <Typography.Paragraph type="secondary">
            恢复前会校验文件并展示摘要。无效文件不会改变当前数据。
          </Typography.Paragraph>
          <Button
            danger
            icon={<Upload size={16} />}
            onClick={chooseBackup}
          >
            选择备份文件
          </Button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".json,application/json"
            aria-label="选择备份文件"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void previewFile(file)
              event.target.value = ''
            }}
          />
        </Card>
      </div>

      <Card title="数据表记录" size="small">
        <Descriptions
          size="small"
          column={4}
          items={Object.entries(counts ?? {}).map(([name, count]) => ({
            key: name,
            label: name,
            children: count,
          }))}
        />
      </Card>

      <Modal
        title="恢复备份摘要"
        open={Boolean(preview)}
        okText="恢复并替换"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={restoring}
        onCancel={() => setPreview(undefined)}
        onOk={askRestore}
      >
        {preview ? (
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'exportedAt',
                label: '导出时间',
                children: new Date(preview.exportedAt).toLocaleString(),
              },
              {
                key: 'schemaVersion',
                label: '数据版本',
                children: preview.schemaVersion,
              },
              {
                key: 'appVersion',
                label: '应用版本',
                children: preview.appVersion,
              },
              {
                key: 'records',
                label: '记录数量',
                children: Object.values(preview.counts).reduce(
                  (sum, count) => sum + count,
                  0,
                ),
              },
            ]}
          />
        ) : null}
        <Typography.Paragraph type="warning" className="backup-warning">
          恢复将替换当前全部数据。建议先导出当前数据作为安全副本。
        </Typography.Paragraph>
      </Modal>

      <Space className="backup-footnote">
        <RotateCcw size={14} />
        <span>
          清理浏览器数据或重装系统仍可能删除应用内数据，请定期导出备份。
        </span>
      </Space>
    </section>
  )
}
