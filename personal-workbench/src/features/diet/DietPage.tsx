import { useState } from 'react'
import {
  App,
  Button,
  Card,
  DatePicker,
  InputNumber,
  Space,
  Table,
  Tag,
} from 'antd'
import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Plus, ShoppingCart } from 'lucide-react'
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton'
import { FormDrawer } from '../../components/FormDrawer'
import { PageHeader } from '../../components/PageHeader'
import { db, repositories } from '../../db/database'
import type {
  ActionStatus,
  MealPlan,
  MealType,
  ShoppingItem,
} from '../../domain/types'

const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function DietPage() {
  const { message } = App.useApp()
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [planOpen, setPlanOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MealPlan>()
  const [shopping, setShopping] = useState<ShoppingItem>()

  const data = useLiveQuery(
    async () => ({
      plans: await db.mealPlans.where('date').equals(date).toArray(),
      logs: await db.mealLogs.where('date').equals(date).toArray(),
      water: await db.waterLogs.where('date').equals(date).toArray(),
      shopping: await db.shoppingItems.toArray(),
    }),
    [date],
  )

  const waterTotal = (data?.water ?? []).reduce(
    (sum, item) => sum + item.amountMl,
    0,
  )

  const addWater = async (amountMl: number) => {
    await repositories.waterLogs.create({ date, amountMl })
    message.success(`已记录 ${amountMl} ml 饮水`)
  }

  return (
    <section className="page">
      <PageHeader
        title="饮食计划"
        description="安排每餐、记录实际饮食和饮水，并维护食材购物清单。"
        actions={
          <Space>
            <DatePicker
              value={dayjs(date)}
              allowClear={false}
              onChange={(value) => {
                if (value) setDate(value.format('YYYY-MM-DD'))
              }}
            />
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingPlan(undefined)
                setPlanOpen(true)
              }}
            >
              安排饮食
            </Button>
          </Space>
        }
      />

      <div className="meal-grid">
        {mealTypes.map((mealType) => {
          const plan = data?.plans.find((item) => item.mealType === mealType)
          const log = data?.logs.find((item) => item.mealType === mealType)
          return (
            <Card
              key={mealType}
              size="small"
              title={mealLabels[mealType]}
              extra={
                plan ? (
                  <Space size={2}>
                    <Button
                      type="text"
                      size="small"
                      aria-label={`编辑${mealLabels[mealType]}安排`}
                      onClick={() => {
                        setEditingPlan(plan)
                        setPlanOpen(true)
                      }}
                    >
                      编辑
                    </Button>
                    {plan.status !== 'completed' ? (
                      <Button
                        type="text"
                        size="small"
                        icon={<Check size={15} />}
                        aria-label={`完成${mealLabels[mealType]}安排`}
                        onClick={() =>
                          repositories.mealPlans.update(plan.id, {
                            status: 'completed',
                          })
                        }
                      />
                    ) : null}
                    <ConfirmDeleteButton
                      description={
                        plan.status !== 'completed'
                          ? '该饮食安排会出现在今日计划中，删除后关联行动会一起消失。'
                          : '删除后无法恢复。'
                      }
                      onConfirm={() => repositories.mealPlans.remove(plan.id)}
                    />
                  </Space>
                ) : null
              }
            >
              <div className="meal-block">
                <span className="meal-block__label">计划</span>
                <p>{plan?.plannedItems || '尚未安排'}</p>
                {plan ? (
                  <Tag color={plan.status === 'completed' ? 'success' : 'default'}>
                    {plan.status === 'completed' ? '已执行' : '待执行'}
                  </Tag>
                ) : null}
              </div>
              <div className="meal-block">
                <span className="meal-block__label">实际</span>
                <p>{log?.actualItems || '尚未记录'}</p>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setEditingPlan(undefined)
                    setLogOpen(true)
                    setShopping(undefined)
                    sessionStorage.setItem('dietMealType', mealType)
                  }}
                >
                  记录实际饮食
                </Button>
                {log ? (
                  <ConfirmDeleteButton
                    onConfirm={() => repositories.mealLogs.remove(log.id)}
                  />
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="diet-lower-grid">
        <Card
          title="今日饮水"
          size="small"
          extra={
            data?.water.length ? (
              <ConfirmDeleteButton
                ariaLabel="清除今日饮水"
                title="清除今天的饮水记录？"
                description="今天记录的所有饮水量会被删除。"
                onConfirm={async () => {
                  await db.waterLogs.where('date').equals(date).delete()
                }}
              />
            ) : null
          }
        >
          <div className="water-total">
            <strong>{waterTotal}</strong>
            <span>ml</span>
          </div>
          <Space wrap>
            {[250, 500].map((amount) => (
              <Button key={amount} onClick={() => void addWater(amount)}>
                +{amount} ml
              </Button>
            ))}
            <InputNumber
              min={1}
              placeholder="自定义 ml"
              aria-label="自定义饮水量"
              onPressEnter={(event) => {
                const value = Number(event.currentTarget.value)
                if (value > 0) void addWater(value)
              }}
            />
          </Space>
          <div className="record-note">
            已记录 {(data?.water ?? []).length} 次饮水
          </div>
          {data?.water.length ? (
            <div className="water-history">
              {data.water
                .slice()
                .sort((left, right) =>
                  right.createdAt.localeCompare(left.createdAt),
                )
                .map((item) => (
                  <Tag key={item.id}>
                    {dayjs(item.createdAt).format('HH:mm')} · {item.amountMl} ml
                  </Tag>
                ))}
            </div>
          ) : null}
        </Card>

        <Card
          title="购物清单"
          size="small"
          extra={
            <Button
              type="text"
              icon={<Plus size={15} />}
              onClick={() => {
                setShopping(undefined)
                setShoppingOpen(true)
              }}
            >
              新增食材
            </Button>
          }
        >
          <Table
            rowKey="id"
            size="small"
            dataSource={data?.shopping ?? []}
            pagination={false}
            locale={{ emptyText: '暂无购物项目' }}
            columns={[
              {
                title: '食材',
                dataIndex: 'name',
                render: (value: string, item) => (
                  <span
                    className={item.purchased ? 'plan-title--completed' : ''}
                  >
                    {value}
                  </span>
                ),
              },
              { title: '数量', dataIndex: 'quantity', width: 90 },
              {
                title: '购买',
                width: 60,
                render: (_, item) => (
                  <Button
                    type={item.purchased ? 'primary' : 'text'}
                    size="small"
                    icon={<ShoppingCart size={15} />}
                    aria-label={`${item.purchased ? '取消购买' : '标记购买'}${item.name}`}
                    onClick={() =>
                      repositories.shoppingItems.update(item.id, {
                        purchased: !item.purchased,
                      })
                    }
                  />
                ),
              },
              {
                title: '操作',
                width: 70,
                render: (_, item) => (
                  <Space size={2}>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => {
                        setShopping(item)
                        setShoppingOpen(true)
                      }}
                    >
                      编辑
                    </Button>
                    <ConfirmDeleteButton
                      description={
                        item.plannedDate
                          ? '该购物项目已关联今日计划，删除后关联行动会一起消失。'
                          : '删除后无法恢复。'
                      }
                      onConfirm={() =>
                        repositories.shoppingItems.remove(item.id)
                      }
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <FormDrawer
        open={planOpen}
        title={editingPlan ? '编辑饮食安排' : '新增饮食安排'}
        fields={[
          {
            name: 'date',
            label: '日期',
            input: 'date',
            required: true,
            span: 12,
          },
          {
            name: 'mealType',
            label: '餐次',
            input: 'select',
            required: true,
            span: 12,
            options: mealTypes.map((value) => ({
              value,
              label: mealLabels[value],
            })),
          },
          {
            name: 'plannedItems',
            label: '计划饮食',
            input: 'textarea',
            required: true,
          },
          {
            name: 'status',
            label: '状态',
            input: 'select',
            required: true,
            options: [
              { value: 'pending', label: '待执行' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已执行' },
            ],
          },
          { name: 'note', label: '备注', input: 'textarea' },
        ]}
        initialValues={
          editingPlan ?? {
            date,
            mealType: 'breakfast',
            status: 'pending',
          }
        }
        onClose={() => setPlanOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            date: String(values.date),
            mealType: values.mealType as MealType,
            plannedItems: String(values.plannedItems),
            status: values.status as ActionStatus,
            note: values.note ? String(values.note) : undefined,
          }
          if (editingPlan) {
            await repositories.mealPlans.update(editingPlan.id, payload)
          } else {
            await repositories.mealPlans.create(payload)
          }
          setPlanOpen(false)
          message.success('饮食安排已保存')
        }}
      />

      <FormDrawer
        open={logOpen}
        title="记录实际饮食"
        fields={[
          {
            name: 'date',
            label: '日期',
            input: 'date',
            required: true,
            span: 12,
          },
          {
            name: 'mealType',
            label: '餐次',
            input: 'select',
            required: true,
            span: 12,
            options: mealTypes.map((value) => ({
              value,
              label: mealLabels[value],
            })),
          },
          {
            name: 'actualItems',
            label: '实际饮食',
            input: 'textarea',
            required: true,
          },
          { name: 'feeling', label: '身体感受', input: 'textarea' },
        ]}
        initialValues={{
          date,
          mealType:
            (sessionStorage.getItem('dietMealType') as MealType) ??
            'breakfast',
        }}
        onClose={() => setLogOpen(false)}
        onSubmit={async (values) => {
          await repositories.mealLogs.create({
            date: String(values.date),
            mealType: values.mealType as MealType,
            actualItems: String(values.actualItems),
            feeling: values.feeling ? String(values.feeling) : undefined,
          })
          setLogOpen(false)
          message.success('实际饮食已记录')
        }}
      />

      <FormDrawer
        open={shoppingOpen}
        title={shopping ? '编辑购物项目' : '新增购物项目'}
        fields={[
          { name: 'name', label: '食材', input: 'text', required: true },
          { name: 'quantity', label: '数量', input: 'text' },
          {
            name: 'plannedDate',
            label: '计划购买日期',
            input: 'date',
          },
          {
            name: 'purchased',
            label: '已购买',
            input: 'switch',
          },
        ]}
        initialValues={shopping ?? { purchased: false }}
        onClose={() => setShoppingOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            name: String(values.name),
            quantity: values.quantity
              ? String(values.quantity)
              : undefined,
            purchased: Boolean(values.purchased),
            plannedDate: values.plannedDate
              ? String(values.plannedDate)
              : undefined,
          }
          if (shopping) {
            await repositories.shoppingItems.update(shopping.id, payload)
          } else {
            await repositories.shoppingItems.create(payload)
          }
          setShoppingOpen(false)
          message.success('购物项目已保存')
        }}
      />
    </section>
  )
}
