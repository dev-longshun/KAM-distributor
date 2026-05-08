import { useState } from 'react'
import { useAccountsStore } from '@/store/accounts'
import { useTranslation } from '@/hooks/useTranslation'
import { AccountToolbar } from './AccountToolbar'
import { AccountGrid } from './AccountGrid'
import { AddAccountDialog } from './AddAccountDialog'
import { EditAccountDialog } from './EditAccountDialog'
import { GroupManageDialog } from './GroupManageDialog'
import { TagManageDialog } from './TagManageDialog'
import { ExportDialog } from './ExportDialog'
import { Button } from '../ui'
import type { Account } from '@/types/account'
import { ArrowLeft, Loader2, Users } from 'lucide-react'

interface AccountManagerProps {
  onBack?: () => void
}

export function AccountManager({ onBack }: AccountManagerProps): React.ReactNode {
  const {
    isLoading,
    accounts,
    importFromExportData,
    importAccounts,
    batchCheckStatus,
    batchRefreshTokens,
    selectedIds
  } = useAccountsStore()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const { t } = useTranslation()
  const isEn = t('common.unknown') === 'Unknown'

  // 获取要导出的账号列表
  const getExportAccounts = () => {
    const accountList = Array.from(accounts.values())
    if (selectedIds.size > 0) {
      return accountList.filter(acc => selectedIds.has(acc.id))
    }
    return accountList
  }

  // 导出
  const handleExport = (): void => {
    setShowExportDialog(true)
  }

  // 解析 CSV 行（处理引号和逗号）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // 导入
  const handleImport = async (): Promise<void> => {
    const fileData = await window.api.importFromFile()

    if (!fileData) return

    const { content, format } = fileData

    try {
      if (format === 'json') {
        // JSON 格式：完整导出数据
        const data = JSON.parse(content)
        if (data.version && data.accounts && Array.isArray(data.accounts)) {
          // 判断是否为 KAM 完整导出格式（账号含 subscription/usage/credentials.expiresAt）
          const firstAccount = data.accounts[0]
          const isFullKamFormat = firstAccount && (
            firstAccount.subscription || firstAccount.usage || firstAccount.credentials?.expiresAt
          )

          if (isFullKamFormat) {
            // KAM 自身完整导出格式
            const result = importFromExportData(data)
            const skippedInfo = result.errors.find(e => e.id === 'skipped')
            const skippedMsg = skippedInfo ? `，${skippedInfo.error}` : ''
            alert(`导入完成：成功 ${result.success} 个${skippedMsg}`)
          } else {
            // 第三方工具导出的带 version/accounts 结构但账号字段简化的格式
            const items = data.accounts.map((item: Record<string, unknown>) => {
              const creds = (item.credentials || {}) as Record<string, unknown>
              const authMethod = (creds.authMethod as string) || 'social'
              const provider = authMethod === 'social' ? 'Google' : 'BuilderId'
              return {
                email: (item.email as string) || '',
                refreshToken: (creds.refreshToken as string) || '',
                accessToken: (creds.accessToken as string) || undefined,
                csrfToken: (creds.csrfToken as string) || undefined,
                clientId: (creds.clientId as string) || undefined,
                clientSecret: (creds.clientSecret as string) || undefined,
                region: (creds.region as string) || undefined,
                idp: (creds.provider as string) || provider,
                nickname: (item.label as string) || (item.nickname as string) || undefined,
              }
            }).filter((item: { refreshToken: string }) => item.refreshToken)

            if (items.length === 0) {
              alert('未找到有效的账号数据（需要 refreshToken）')
              return
            }

            const result = importAccounts(items)
            const skippedInfo = result.errors.find(e => e.id === 'skipped')
            const skippedMsg = skippedInfo ? `，${skippedInfo.error}` : ''
            alert(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个${skippedMsg}`)
          }
        } else if (Array.isArray(data) && data.length > 0 && data[0].refreshToken) {
          // 第三方工具导出的 JSON 数组格式
          const firstItem = data[0]
          const hasRichData = firstItem.usageData || firstItem.accessToken

          if (hasRichData) {
            // 丰富格式：含 usageData/accessToken/userId 等完整信息，映射为 KAM 完整格式
            const mappedAccounts = data
              .filter((item: Record<string, unknown>) => item.refreshToken)
              .map((item: Record<string, unknown>) => {
                const usageData = item.usageData as Record<string, unknown> | undefined
                const usageBreakdownList = (usageData?.usageBreakdownList as Array<Record<string, unknown>>) || []
                const breakdown = usageBreakdownList[0] || {}
                const subscriptionInfo = (usageData?.subscriptionInfo as Record<string, unknown>) || {}
                const authMethod = (item.authMethod as string) || 'social'
                const provider = (item.provider as string) || (authMethod === 'social' ? 'Google' : 'BuilderId')

                // 解析订阅类型
                let subscriptionType = 'Free'
                const subTitle = (subscriptionInfo.subscriptionTitle as string) || ''
                const titleUpper = subTitle.toUpperCase()
                if (titleUpper.includes('PRO+') || titleUpper.includes('PRO_PLUS')) {
                  subscriptionType = 'Pro_Plus'
                } else if (titleUpper.includes('PRO')) {
                  subscriptionType = 'Pro'
                } else if (titleUpper.includes('ENTERPRISE') || titleUpper.includes('POWER')) {
                  subscriptionType = 'Enterprise'
                } else if (titleUpper.includes('TEAMS')) {
                  subscriptionType = 'Teams'
                }

                // 解析过期时间
                let expiresAt = Date.now() + 3600 * 1000
                if (item.expiresAt && typeof item.expiresAt === 'string') {
                  const parsed = new Date(item.expiresAt.replace(/\//g, '-')).getTime()
                  if (!isNaN(parsed)) expiresAt = parsed
                }

                const usageLimit = (breakdown.usageLimit as number) || (breakdown.usageLimitWithPrecision as number) || 1000
                const currentUsage = (breakdown.currentUsage as number) || (breakdown.currentUsageWithPrecision as number) || 0

                return {
                  id: (item.id as string) || crypto.randomUUID(),
                  email: (item.email as string) || '',
                  nickname: (item.label as string) || (item.nickname as string) || undefined,
                  idp: provider as 'Google' | 'Github' | 'BuilderId' | 'Enterprise',
                  userId: (item.userId as string) || undefined,
                  machineId: (item.machineId as string) || undefined,
                  profileArn: (item.profileArn as string) || undefined,
                  credentials: {
                    accessToken: (item.accessToken as string) || '',
                    csrfToken: '',
                    refreshToken: (item.refreshToken as string) || '',
                    clientId: (item.clientId as string) || undefined,
                    clientSecret: (item.clientSecret as string) || undefined,
                    region: (item.region as string) || 'us-east-1',
                    expiresAt,
                    authMethod: authMethod as 'IdC' | 'social',
                    provider: provider as 'BuilderId' | 'Enterprise' | 'Github' | 'Google'
                  },
                  subscription: {
                    type: subscriptionType as 'Free' | 'Pro' | 'Pro_Plus' | 'Enterprise' | 'Teams',
                    title: subTitle || undefined,
                    upgradeCapability: (subscriptionInfo.upgradeCapability as string) || undefined,
                    overageCapability: (subscriptionInfo.overageCapability as string) || undefined,
                    managementTarget: (subscriptionInfo.subscriptionManagementTarget as string) || undefined
                  },
                  usage: {
                    current: currentUsage,
                    limit: usageLimit,
                    percentUsed: usageLimit > 0 ? currentUsage / usageLimit : 0,
                    lastUpdated: Date.now(),
                    nextResetDate: usageData?.nextDateReset
                      ? new Date((usageData.nextDateReset as number) * 1000).toISOString()
                      : undefined,
                    resourceDetail: breakdown.resourceType ? {
                      resourceType: breakdown.resourceType as string,
                      displayName: breakdown.displayName as string,
                      displayNamePlural: breakdown.displayNamePlural as string,
                      currency: breakdown.currency as string,
                      unit: breakdown.unit as string,
                      overageRate: breakdown.overageRate as number,
                      overageCap: breakdown.overageCap as number,
                    } : undefined
                  },
                  tags: [],
                  status: ((item.status as string) === 'active' ? 'active' : 'unknown') as 'active' | 'unknown',
                  lastUsedAt: Date.now(),
                  createdAt: Date.now()
                }
              })

            const exportData = { version: '1.0.0', exportedAt: Date.now(), accounts: mappedAccounts, groups: [], tags: [] }
            const result = importFromExportData(exportData)
            const skippedInfo = result.errors.find(e => e.id === 'skipped')
            const skippedMsg = skippedInfo ? `，${skippedInfo.error}` : ''
            alert(`导入完成：成功 ${result.success} 个${skippedMsg}`)
          } else {
            // 简化格式：只有 refreshToken 等基本字段
            const items = data.map((item: Record<string, unknown>) => ({
              email: (item.email as string) || '',
              refreshToken: (item.refreshToken as string) || '',
              accessToken: (item.accessToken as string) || undefined,
              csrfToken: (item.csrfToken as string) || undefined,
              clientId: (item.clientId as string) || undefined,
              clientSecret: (item.clientSecret as string) || undefined,
              region: (item.region as string) || undefined,
              idp: (item.provider as string) || (item.idp as string) || 'Google',
              nickname: (item.label as string) || (item.nickname as string) || undefined,
            })).filter((item: { email: string; refreshToken: string }) => item.refreshToken)

            if (items.length === 0) {
              alert('未找到有效的账号数据（需要 refreshToken）')
              return
            }

            const result = importAccounts(items)
            const skippedInfo = result.errors.find(e => e.id === 'skipped')
            const skippedMsg = skippedInfo ? `，${skippedInfo.error}` : ''
            alert(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个${skippedMsg}`)
          }
        } else {
          alert('无效的 JSON 文件格式')
        }
      } else if (format === 'csv') {
        // CSV 格式：邮箱,昵称,登录方式,RefreshToken,ClientId,ClientSecret,Region
        const lines = content.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          alert('CSV 文件为空或只有标题行')
          return
        }

        // 跳过标题行，解析数据行
        const items = lines.slice(1).map(line => {
          const cols = parseCSVLine(line)
          return {
            email: cols[0] || '',
            nickname: cols[1] || undefined,
            idp: cols[2] || 'Google',
            refreshToken: cols[3] || '',
            clientId: cols[4] || '',
            clientSecret: cols[5] || '',
            region: cols[6] || 'us-east-1'
          }
        }).filter(item => item.email && item.refreshToken)

        if (items.length === 0) {
          alert('未找到有效的账号数据（需要邮箱和 RefreshToken）')
          return
        }

        const result = importAccounts(items)
        alert(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个`)
      } else if (format === 'txt') {
        // TXT 格式：每行一个账号，格式为 邮箱,RefreshToken 或 邮箱|RefreshToken
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
        
        const items = lines.map(line => {
          // 支持逗号或竖线分隔
          const parts = line.includes('|') ? line.split('|') : line.split(',')
          return {
            email: parts[0]?.trim() || '',
            refreshToken: parts[1]?.trim() || '',
            nickname: parts[2]?.trim() || undefined,
            idp: parts[3]?.trim() || 'Google'
          }
        }).filter(item => item.email && item.refreshToken)

        if (items.length === 0) {
          alert('未找到有效的账号数据（格式：邮箱,RefreshToken）')
          return
        }

        const result = importAccounts(items)
        alert(`导入完成：成功 ${result.success} 个，失败 ${result.failed} 个`)
      } else {
        alert(`不支持的文件格式：${format}`)
      }
    } catch (e) {
      console.error('Import error:', e)
      alert('解析导入文件失败')
    }

    // 导入完成后，自动对 status=unknown 的账号先刷新 token 再检查状态（异步，不阻塞）
    const unknownIds = Array.from(accounts.values())
      .filter(a => a.status === 'unknown')
      .map(a => a.id)
    if (unknownIds.length > 0) {
      batchRefreshTokens(unknownIds)
        .then(() => batchCheckStatus(unknownIds))
        .catch(() => {})
    }
  }

  // 管理分组
  const handleManageGroups = (): void => {
    setShowGroupDialog(true)
  }

  // 管理标签
  const handleManageTags = (): void => {
    setShowTagDialog(true)
  }

  // 编辑账号
  const handleEditAccount = (account: Account): void => {
    setEditingAccount(account)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">加载账号数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-primary">{isEn ? 'Accounts' : '账户管理'}</h1>
          </div>
        </div>
        
        {/* 工具栏 */}
        <AccountToolbar
          onAddAccount={() => setShowAddDialog(true)}
          onImport={handleImport}
          onExport={handleExport}
          onManageGroups={handleManageGroups}
          onManageTags={handleManageTags}
          isFilterExpanded={isFilterExpanded}
          onToggleFilter={() => setIsFilterExpanded(!isFilterExpanded)}
        />
      </header>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
        {/* 账号网格 */}
        <div className="flex-1 overflow-hidden">
          <AccountGrid
            onAddAccount={() => setShowAddDialog(true)}
            onEditAccount={handleEditAccount}
          />
        </div>
      </div>

      {/* 添加账号对话框 */}
      <AddAccountDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {/* 编辑账号对话框 */}
      <EditAccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        account={editingAccount}
      />

      {/* 分组管理对话框 */}
      <GroupManageDialog
        isOpen={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
      />

      {/* 标签管理对话框 */}
      <TagManageDialog
        isOpen={showTagDialog}
        onClose={() => setShowTagDialog(false)}
      />

      {/* 导出对话框 */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        accounts={getExportAccounts()}
        selectedCount={selectedIds.size}
      />
    </div>
  )
}
