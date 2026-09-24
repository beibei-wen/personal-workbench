import type { CSSProperties } from 'react'
import { Button, Layout, Menu, Tooltip } from 'antd'
import { DatabaseBackup } from 'lucide-react'
import dayjs from 'dayjs'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { navigationItems } from './navigation'
import { TopQuickNoteButton } from '../features/quick-notes/QuickNoteCreateModal'

const { Header, Sider, Content } = Layout

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentItem =
    navigationItems.find((item) => item.path === location.pathname) ??
    navigationItems[0]
  const accentStyle = {
    '--module-accent': currentItem.accent,
    '--module-accent-soft': currentItem.accentSoft,
  } as CSSProperties

  return (
    <Layout className="app-shell">
      <Sider width={248} theme="light" className="app-sider">
        <div className="app-brand">
          <div className="app-brand__mark">LW</div>
          <div>
            <strong>工作生活台</strong>
            <span>只保存在这台电脑</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navigationItems.map((item) => {
            const Icon = item.icon
            return {
              key: item.path,
              className: 'nav-item',
              style: {
                '--nav-accent': item.accent,
                '--nav-soft': item.accentSoft,
              } as CSSProperties,
              icon: (
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
              ),
              label: item.label,
            }
          })}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={accentStyle}>
          <div className="app-header__context">
            <span>
              {navigationItems.find((item) => item.path === location.pathname)
                ?.description ?? '个人工作与生活'}
            </span>
            <span className="app-header__date">
              {dayjs().format('YYYY年M月D日 dddd')}
            </span>
          </div>
          <div className="app-header__actions">
            <TopQuickNoteButton />
            <Tooltip title="导出或恢复本机数据">
              <Button
                icon={<DatabaseBackup size={17} />}
                onClick={() => navigate('/backup')}
              >
                数据与备份
              </Button>
            </Tooltip>
          </div>
        </Header>
        <Content className="app-content" style={accentStyle}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
