/**
 * Story Compilation Test
 *
 * This script validates that all Storybook stories compile without errors.
 * It imports all story files to ensure TypeScript can process them.
 */

// Import all story files to validate TypeScript compilation
import './src/atoms/stories/AuditEventBadge.stories'
import './src/atoms/stories/Badge.stories'
import './src/atoms/stories/Button.stories'
import './src/atoms/stories/Checkbox.stories'
import './src/atoms/stories/Heading.stories'
import './src/atoms/stories/Input.stories'
import './src/atoms/stories/Label.stories'
import './src/atoms/stories/Select.stories'
import './src/atoms/stories/Spinner.stories'
import './src/atoms/stories/Table.stories'
import './src/atoms/stories/Text.stories'
import './src/atoms/stories/Textarea.stories'

import './src/molecules/stories/ActionCard.stories'
import './src/molecules/stories/ActivityFeed.stories'
import './src/molecules/stories/Card.stories'
import './src/molecules/stories/EmptyState.stories'
import './src/molecules/stories/MetricCard.stories'
import './src/molecules/stories/Pagination.stories'
import './src/molecules/stories/ProgressBar.stories'

import './src/organisms/stories/AnalyticsMetricsGrid.stories'
import './src/organisms/stories/BlockCreationChart.stories'
import './src/organisms/stories/BlockDetailPanel.stories'
import './src/organisms/stories/BlockTimeline.stories'
import './src/organisms/stories/ChainHealthDashboard.stories'
import './src/organisms/stories/CollectionStatsCard.stories'
import './src/organisms/stories/CollectionsTable.stories'
import './src/organisms/stories/DataGrowthChart.stories'
import './src/organisms/stories/Header.stories'
import './src/organisms/stories/HistoricalAuditTable.stories'
import './src/organisms/stories/Navigation.stories'
import './src/organisms/stories/NetworkActions.stories'
import './src/organisms/stories/NetworkHealthCard.stories'
import './src/organisms/stories/NodeStatsGrid.stories'
import './src/organisms/stories/PeerConnectivityTable.stories'
import './src/organisms/stories/RealTimeAuditStream.stories'
import './src/organisms/stories/RecentActivityTimeline.stories'
import './src/organisms/stories/TableToolbar.stories'
import './src/organisms/stories/ValidatorPerformanceCard.stories'

import './src/primitives/stories/Container.stories'
import './src/primitives/stories/Grid.stories'
import './src/primitives/stories/Stack.stories'

import './src/templates/stories/AuthLayout.stories'
import './src/templates/stories/DashboardLayout.stories'
import './src/templates/stories/PageContainer.stories'

import './src/forms/stories/LoginForm.stories'
import './src/forms/stories/SubmitDataForm.stories'

console.log('✓ All Storybook stories compiled successfully')
