import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation, formatDate, formatNumber } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import NestedScreenHeader from '@/components/elements/NestedScreenHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import { selectCustomersByAgent } from '@/slices/customers.slice';
import {
  selectAllRoutes,
  selectBranchTimezone,
  selectCurrentAgent,
  selectCurrentBranch,
  selectSession,
} from '@/slices/settings.slice';
import { selectSettlementsByAgentAndMonth } from '@/slices/settlements.slice';
import { selectMonthlyCollectionReport } from '@/slices/reports.slice';
import { getCurrentBusinessDate } from '@/utils/businessLogic';
import { navigateToSettlementDetail } from '@/utils/navigation';
import {
  generateMonthlyCollectionPdf,
  previewPdf,
  savePdf,
  sharePdf,
  type GeneratedPdf,
} from '@/services/pdf';
import { SettlementScope } from '@/types';

/** Shared geometry so frozen + scrollable halves paint as one table */
const TABLE_HEADER_HEIGHT = 64;
const TABLE_ROW_HEIGHT = 60;
const TABLE_TOTAL_ROW_HEIGHT = 60;
const CUSTOMER_COLUMN_WIDTH = 150;
const DAY_COLUMN_WIDTH = 80;
const TOTAL_COLUMN_WIDTH = 100;
const METRIC_COLUMN_WIDTH = 90;

/** Keeps the reconciliation banner from crowding out the table when many issues exist */
const MAX_VISIBLE_AUDIT_ERRORS = 3;

/** Display only: a zero in this table means "nothing happened", which reads better as a dash */
const EMPTY_CELL = '—';

function formatCellValue(value: number): string {
  return value === 0 ? EMPTY_CELL : formatNumber(value);
}

/** Parses the "Month Year" route param (e.g. "December 2025") into that month's first day */
function parseMonthParam(value?: string): Date | null {
  if (!value) return null;

  const parts = value.split(' ');
  if (parts.length !== 2) return null;

  const year = parseInt(parts[1], 10);
  const probe = new Date(`${parts[0]} 1, ${year}`);
  if (Number.isNaN(probe.getTime())) return null;

  return new Date(year, probe.getMonth(), 1);
}

export default function MonthlyCollections() {
  const { theme } = useTheme();
  const { t, language } = useTranslation();
  const { month } = useLocalSearchParams<{ month?: string }>();
  const [activePicker, setActivePicker] = useState<'month' | 'route' | 'pdfActions' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [routeFilter, setRouteFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'collections' | 'settlements'>('collections');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<GeneratedPdf | null>(null);

  // Get session
  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agent = useSelector(selectCurrentAgent);
  const branch = useSelector(selectCurrentBranch);
  const agentId = session.agentId || 'demo-agent';

  // "Now" is the branch business date, never the device calendar
  const currentBusinessDate = getCurrentBusinessDate(timezone);
  const [businessYear, businessMonthIndex] = useMemo(() => {
    const [year, monthNumber] = currentBusinessDate.split('-').map(Number);
    return [year, monthNumber - 1];
  }, [currentBusinessDate]);

  // Selected month, or the month from the route param, or the current business month
  const paramMonth = useMemo(() => parseMonthParam(month), [month]);
  const activeMonth = selectedMonth ?? paramMonth ?? new Date(businessYear, businessMonthIndex, 1);
  const currentYear = activeMonth.getFullYear();
  const currentMonthIndex = activeMonth.getMonth();

  // This screen reports the agent's own book. PRIMARY and DELEGATED cash never merge.
  const report = useSelector((state: State) =>
    selectMonthlyCollectionReport(
      state,
      currentYear,
      // The selector takes month 1-12; Date.getMonth() is 0-11
      currentMonthIndex + 1,
      currentBusinessDate,
      agentId,
      SettlementScope.PRIMARY,
      routeFilter ?? undefined,
    ),
  );

  // Same selected month drives Settlements mode — no separate month state
  const monthSettlements = useSelector((state: State) =>
    selectSettlementsByAgentAndMonth(state, agentId, report.monthPrefix),
  );

  // Route options come from the agent's own customers, not a report-only ownership map
  const myPrimaryCustomers = useSelector((state: State) => selectCustomersByAgent(state, agentId));
  const allRoutes = useSelector(selectAllRoutes);
  const routeOptions = useMemo(() => {
    const myRouteIds = new Set(myPrimaryCustomers.map(customer => customer.routeId));
    return allRoutes.filter(route => myRouteIds.has(route.id));
  }, [myPrimaryCustomers, allRoutes]);

  const selectedRouteName = routeFilter
    ? allRoutes.find(route => route.id === routeFilter)?.name
    : undefined;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    controlsContainer: {
      backgroundColor: theme.colors.background.app,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingBottom: spacing(theme, 'xs'),
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    dateText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    dateIcon: {
      fontSize: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      marginLeft: 'auto',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.colors.background.cardElevated,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonPrimary: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    iconButtonIcon: {
      fontSize: 18,
      color: theme.colors.text.primary,
    },
    iconButtonIconPrimary: {
      color: '#FFFFFF',
    },
    filtersRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'sm'),
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    filterChipActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    filterChipText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    filterChipTextActive: {
      ...typography(theme, 'caption'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    filterChipIcon: {
      fontSize: 12,
      color: '#FFFFFF',
    },
    filterDropdownIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
    // Same visual language as Home Primary / Delegated tabs
    modeTabsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'sm'),
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
    },
    modeTabActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    modeTabText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    modeTabTextActive: {
      color: '#FFFFFF',
    },
    tableContainer: {
      flex: 1,
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    tableShell: {
      flex: 1,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderRadius: radius(theme, 'card'),
      overflow: 'hidden',
      backgroundColor: theme.colors.background.card,
    },
    frozenColumn: {
      width: CUSTOMER_COLUMN_WIDTH,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      zIndex: 2,
    },
    scrollableColumns: {
      flex: 1,
    },
    // Exact shared heights — content must not resize either half independently
    headerRow: {
      height: TABLE_HEADER_HEIGHT,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.app,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    headerRowDates: {
      height: TABLE_HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.app,
      overflow: 'hidden',
    },
    dataRow: {
      height: TABLE_ROW_HEIGHT,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dataRowDates: {
      height: TABLE_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      overflow: 'hidden',
    },
    footerRow: {
      height: TABLE_TOTAL_ROW_HEIGHT,
      borderTopWidth: 2,
      borderTopColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    footerRowDates: {
      height: TABLE_TOTAL_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 2,
      borderTopColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
      overflow: 'hidden',
    },
    customerHeaderCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    customerBodyCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    customerFooterCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    dayHeaderCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    dayBodyCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    dayFooterCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    totalHeaderCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    totalBodyCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    totalFooterCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    // The missed column leads the scrollable side, so it centres like the day columns
    // it sits next to rather than right-aligning like the trailing money columns.
    missedHeaderCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    missedBodyCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    missedFooterCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    metricHeaderCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    metricBodyCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    metricFooterCell: {
      width: METRIC_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    settlementsSection: {
      flex: 1,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingBottom: spacing(theme, 'md'),
    },
    settlementsList: {
      gap: spacing(theme, 'sm'),
      paddingBottom: spacing(theme, 'lg'),
    },
    settlementCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.brand.primary,
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xs'),
      overflow: 'hidden',
    },
    settlementSummaryTitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settlementTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settlementDate: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    settlementStatus: {
      ...typography(theme, 'caption'),
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    settlementScope: {
      ...typography(theme, 'caption'),
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.text.secondary,
    },
    settlementAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settlementAmountLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
    },
    settlementAmountValue: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    settlementAmountValueStrong: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    emptyState: {
      padding: spacing(theme, 'xxl'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 48,
      opacity: 0.3,
    },
    emptyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    columnHeaderText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 16,
      lineHeight: 20,
    },
    dayHeaderText: {
      ...typography(theme, 'pageTitle'),
      fontSize: 16,
      lineHeight: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    daySubText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    totalHeaderText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    customerCellContent: {
      gap: 2,
    },
    customerName: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: 13,
    },
    customerAcctNo: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    cellTextAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      textAlign: 'center',
      fontSize: 13,
    },
    cellTextEmpty: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      fontSize: 13,
    },
    cellTextTotal: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'right',
      fontSize: 13,
    },
    cellTextMetric: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      textAlign: 'right',
      fontSize: 13,
    },
    cellTextMissed: {
      ...typography(theme, 'body'),
      color: theme.colors.status.warning,
      fontWeight: '600',
      textAlign: 'right',
      fontSize: 13,
    },
    totalLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 16,
      lineHeight: 20,
    },
    totalAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 16,
      lineHeight: 20,
    },
    totalAmountGrand: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'right',
      fontSize: 16,
      lineHeight: 20,
    },
    auditBanner: {
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'sm'),
      padding: spacing(theme, 'md'),
      backgroundColor: 'rgba(255, 92, 92, 0.1)',
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.status.error,
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    auditIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.status.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    auditIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    auditContent: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    auditTitle: {
      ...typography(theme, 'body'),
      color: theme.colors.status.error,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    auditMessage: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.primary,
      fontSize: 12,
    },
    auditOkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'xs'),
    },
    auditOkText: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.success,
      fontSize: 11,
      fontWeight: '600',
    },
    pickerContent: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xl'),
    },
    pickerTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing(theme, 'lg'),
      textAlign: 'center',
    },
    pickerOptionsList: {
      gap: spacing(theme, 'xs'),
    },
    pickerOption: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
    },
    pickerOptionSelected: {
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderColor: theme.colors.brand.primary,
    },
    pickerOptionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    pickerOptionTextSelected: {
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    pdfActions: {
      paddingHorizontal: spacing(theme, 'lg'),
      paddingBottom: spacing(theme, 'lg'),
      gap: spacing(theme, 'md'),
    },
    pdfActionsTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    pdfActionsMessage: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    pdfActionsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing(theme, 'xs'),
    },
    pdfActionButton: {
      flex: 1,
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      minHeight: theme.ux.touchTargetMin,
    },
    pdfActionIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.cardElevated,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    pdfActionIconWrapPrimary: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    pdfActionLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
    setActivePicker(null);
  };

  const handleRouteChange = (newRouteId: string | null) => {
    setRouteFilter(newRouteId);
    setActivePicker(null);
  };

  /**
   * Builds a PDF from the report model already on screen — no second projection.
   */
  const handleExportPdf = async () => {
    if (isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const pdf = await generateMonthlyCollectionPdf({
        report,
        t,
        language,
        names: {
          agentName: agent?.name,
          routeName: selectedRouteName,
          branchName: branch?.name,
        },
      });
      setGeneratedPdf(pdf);
      setActivePicker('pdfActions');
    } catch {
      Alert.alert(t('pdf.generateFailedTitle'), t('pdf.generateFailed'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!generatedPdf) {
      return;
    }
    await previewPdf(generatedPdf);
  };

  const handleSharePdf = async () => {
    if (!generatedPdf) {
      return;
    }
    try {
      await sharePdf(generatedPdf, t('pdf.share'));
    } catch {
      Alert.alert(t('pdf.generateFailedTitle'), t('pdf.shareUnavailable'));
    }
  };

  const handleSavePdf = async () => {
    if (!generatedPdf) {
      return;
    }
    try {
      const result = await savePdf(generatedPdf);
      if (result === 'saved') {
        Alert.alert(t('pdf.saveSuccessTitle'), t('pdf.saveSuccess'));
      }
    } catch {
      Alert.alert(t('pdf.generateFailedTitle'), t('pdf.saveFailed'));
    }
  };

  // Month options are anchored to the business month, not the device calendar
  const monthOptions = useMemo(() => {
    const options: Date[] = [];
    for (let offset = 9; offset >= -3; offset--) {
      options.push(new Date(businessYear, businessMonthIndex - offset, 1));
    }
    return options;
  }, [businessYear, businessMonthIndex]);

  const getDayOfWeek = (day: number) => {
    const date = new Date(report.year, report.month - 1, day);
    return formatDate(date, language, { weekday: 'short' }).toUpperCase();
  };

  // User-driven vertical scroll only: the other half mirrors and must not sync back.
  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);
  const verticalDriverRef = useRef<'left' | 'right' | null>(null);

  const clearVerticalDriver = () => {
    verticalDriverRef.current = null;
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Keep the driver through a fling; only clear when the gesture ends at rest.
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocityY) < 0.05) {
      clearVerticalDriver();
    }
  };

  const handleLeftScrollBeginDrag = () => {
    verticalDriverRef.current = 'left';
  };

  const handleRightScrollBeginDrag = () => {
    verticalDriverRef.current = 'right';
  };

  const handleLeftScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalDriverRef.current !== 'left') return;
    rightScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
  };

  const handleRightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalDriverRef.current !== 'right') return;
    leftScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
  };

  const hasMonthCollections = report.collectionCount > 0;
  const dayNumbers = Array.from({ length: report.daysInMonth }, (_, i) => i + 1);
  const monthLabel = `${formatDate(activeMonth, language, { month: 'short' })} ${currentYear}`;
  const headerSubtitle = `${branch?.name ?? t('monthlyCollections.branchFallback')} · ${t('monthlyCollections.primaryBook')}`;
  const visibleAuditErrors = report.auditErrors.slice(0, MAX_VISIBLE_AUDIT_ERRORS);
  const hiddenAuditErrorCount = report.auditErrors.length - visibleAuditErrors.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NestedScreenHeader title={t('monthlyCollections.title')} subtitle={headerSubtitle} />

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <Pressable onPress={() => setActivePicker('month')} style={styles.dateButton}>
            <Text style={styles.dateText}>{monthLabel}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </Pressable>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleExportPdf}
              disabled={isExportingPdf}
              accessibilityRole="button"
              accessibilityLabel={isExportingPdf ? t('pdf.generating') : t('pdf.exportPdf')}
              style={({ pressed }) => [
                styles.iconButton,
                styles.iconButtonPrimary,
                { opacity: isExportingPdf || pressed ? 0.8 : 1 },
              ]}>
              {isExportingPdf ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.iconButtonIcon, styles.iconButtonIconPrimary]}>📄</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Mode tiles share the selected month above — switching modes does not reset month */}
      <View style={styles.modeTabsRow}>
        <Pressable
          onPress={() => setViewMode('collections')}
          style={({ pressed }) => [
            styles.modeTab,
            viewMode === 'collections' && styles.modeTabActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text
            style={[styles.modeTabText, viewMode === 'collections' && styles.modeTabTextActive]}>
            {t('monthlyCollections.collections')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('settlements')}
          style={({ pressed }) => [
            styles.modeTab,
            viewMode === 'settlements' && styles.modeTabActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text
            style={[styles.modeTabText, viewMode === 'settlements' && styles.modeTabTextActive]}>
            {t('monthlyCollections.settlements')}
          </Text>
        </Pressable>
      </View>

      {viewMode === 'collections' && (
        <>
          {/* Restored later: agent / route / status filter chips.
          <View style={styles.filtersRow}>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {t('monthlyCollections.agentFilter', { name: agent?.name ?? t('common.unnamedAgent') })}
              </Text>
            </View>

            <Pressable
              onPress={() => setActivePicker('route')}
              style={[styles.filterChip, !!routeFilter && styles.filterChipActive]}>
              <Text style={routeFilter ? styles.filterChipTextActive : styles.filterChipText}>
                {t('monthlyCollections.routeFilter', { name: selectedRouteName })}
              </Text>
              <Text style={routeFilter ? styles.filterChipIcon : styles.filterDropdownIcon}>▼</Text>
            </Pressable>

            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{t('monthlyCollections.statusActive')}</Text>
            </View>
          </View>
          */}

          {/* Real reconciliation outcome — never a fixed success state */}
          {report.isAuditSuccessful ? (
            <View style={styles.auditOkRow}>
              <Text style={styles.auditOkText}>{t('monthlyCollections.reconciled')}</Text>
            </View>
          ) : (
            <View style={styles.auditBanner}>
              <View style={styles.auditIconContainer}>
                <Text style={styles.auditIcon}>!</Text>
              </View>
              <View style={styles.auditContent}>
                <Text style={styles.auditTitle}>
                  {t(
                    report.auditErrors.length === 1
                      ? 'monthlyCollections.auditIssueOne'
                      : 'monthlyCollections.auditIssueOther',
                    { count: report.auditErrors.length },
                  )}
                </Text>
                {visibleAuditErrors.map((error, index) => (
                  <Text key={`audit-error-${index}`} style={styles.auditMessage}>
                    • {error}
                  </Text>
                ))}
                {hiddenAuditErrorCount > 0 && (
                  <Text style={styles.auditMessage}>
                    •{' '}
                    {t(
                      hiddenAuditErrorCount === 1
                        ? 'monthlyCollections.moreIssueOne'
                        : 'monthlyCollections.moreIssueOther',
                      { count: hiddenAuditErrorCount },
                    )}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.tableContainer}>
            {!hasMonthCollections ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>{t('monthlyCollections.empty')}</Text>
              </View>
            ) : (
              <View style={styles.tableShell}>
                {/* Frozen Customer column — stays put during horizontal scroll */}
                <View style={styles.frozenColumn}>
                  <View style={[styles.headerRow, styles.customerHeaderCell]}>
                    <Text style={styles.columnHeaderText}>{t('monthlyCollections.customer')}</Text>
                  </View>

                  <ScrollView
                    ref={leftScrollRef}
                    onScrollBeginDrag={handleLeftScrollBeginDrag}
                    onScroll={handleLeftScroll}
                    onScrollEndDrag={handleScrollEndDrag}
                    onMomentumScrollEnd={clearVerticalDriver}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}>
                    {report.rows.map(row => (
                      <View
                        key={`customer-${row.accountId}`}
                        style={[styles.dataRow, styles.customerBodyCell]}>
                        <View style={styles.customerCellContent}>
                          <Text style={styles.customerName} numberOfLines={1}>
                            {row.customerName}
                          </Text>
                          <Text style={styles.customerAcctNo} numberOfLines={1}>
                            {row.accountNumber}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View style={[styles.footerRow, styles.customerFooterCell]}>
                      <Text style={styles.totalLabel} numberOfLines={1}>
                        {t('monthlyCollections.dailyTotal')}
                      </Text>
                    </View>
                  </ScrollView>
                </View>

                {/* Date + Total columns — one horizontal scroll keeps header and body in sync */}
                <ScrollView
                  horizontal
                  style={styles.scrollableColumns}
                  showsHorizontalScrollIndicator={true}>
                  <View>
                    <View style={styles.headerRowDates}>
                      <View style={styles.missedHeaderCell}>
                        <Text style={styles.columnHeaderText}>
                          {t('monthlyCollections.missed')}
                        </Text>
                      </View>
                      {dayNumbers.map(day => (
                        <View key={day} style={styles.dayHeaderCell}>
                          <Text style={styles.dayHeaderText}>
                            {day.toString().padStart(2, '0')}
                          </Text>
                          <Text style={styles.daySubText}>{getDayOfWeek(day)}</Text>
                        </View>
                      ))}
                      <View style={styles.metricHeaderCell}>
                        <Text style={styles.columnHeaderText}>{t('monthlyCollections.cash')}</Text>
                      </View>
                      <View style={styles.metricHeaderCell}>
                        <Text style={styles.columnHeaderText}>{t('monthlyCollections.upi')}</Text>
                      </View>
                      <View style={styles.totalHeaderCell}>
                        <Text style={styles.totalHeaderText}>{t('monthlyCollections.total')}</Text>
                      </View>
                    </View>

                    <ScrollView
                      ref={rightScrollRef}
                      onScrollBeginDrag={handleRightScrollBeginDrag}
                      onScroll={handleRightScroll}
                      onScrollEndDrag={handleScrollEndDrag}
                      onMomentumScrollEnd={clearVerticalDriver}
                      scrollEventThrottle={16}
                      showsVerticalScrollIndicator={false}>
                      {report.rows.map(row => (
                        <View key={`dates-${row.accountId}`} style={styles.dataRowDates}>
                          {/* Missed days stay visible even though MVP penalty is ₹0 */}
                          <View style={styles.missedBodyCell}>
                            <Text
                              style={
                                row.missedDays > 0 ? styles.cellTextMissed : styles.cellTextEmpty
                              }
                              numberOfLines={1}>
                              {row.missedDays > 0 ? row.missedDays : EMPTY_CELL}
                            </Text>
                          </View>
                          {dayNumbers.map(day => {
                            const dayAmount = row.dailyCollections[day];
                            return (
                              <View key={day} style={styles.dayBodyCell}>
                                <Text
                                  style={dayAmount ? styles.cellTextAmount : styles.cellTextEmpty}
                                  numberOfLines={1}>
                                  {dayAmount || EMPTY_CELL}
                                </Text>
                              </View>
                            );
                          })}
                          <View style={styles.metricBodyCell}>
                            <Text
                              style={
                                row.cashCollected ? styles.cellTextMetric : styles.cellTextEmpty
                              }
                              numberOfLines={1}>
                              {formatCellValue(row.cashCollected)}
                            </Text>
                          </View>
                          <View style={styles.metricBodyCell}>
                            <Text
                              style={
                                row.upiCollected ? styles.cellTextMetric : styles.cellTextEmpty
                              }
                              numberOfLines={1}>
                              {formatCellValue(row.upiCollected)}
                            </Text>
                          </View>
                          <View style={styles.totalBodyCell}>
                            <Text
                              style={row.monthlyTotal ? styles.cellTextTotal : styles.cellTextEmpty}
                              numberOfLines={1}>
                              {formatCellValue(row.monthlyTotal)}
                            </Text>
                          </View>
                        </View>
                      ))}

                      <View style={styles.footerRowDates}>
                        <View style={styles.missedFooterCell}>
                          <Text
                            style={
                              report.totalMissedDays ? styles.totalAmount : styles.cellTextEmpty
                            }
                            numberOfLines={1}>
                            {formatCellValue(report.totalMissedDays)}
                          </Text>
                        </View>
                        {dayNumbers.map(day => {
                          const dayTotal = report.dailyTotals[day] || 0;
                          return (
                            <View key={day} style={styles.dayFooterCell}>
                              <Text
                                style={dayTotal ? styles.totalAmount : styles.cellTextEmpty}
                                numberOfLines={1}>
                                {formatCellValue(dayTotal)}
                              </Text>
                            </View>
                          );
                        })}
                        <View style={styles.metricFooterCell}>
                          <Text
                            style={
                              report.totalCashCollected
                                ? styles.totalAmountGrand
                                : styles.cellTextEmpty
                            }
                            numberOfLines={1}>
                            {formatCellValue(report.totalCashCollected)}
                          </Text>
                        </View>
                        <View style={styles.metricFooterCell}>
                          <Text
                            style={
                              report.totalUpiCollected
                                ? styles.totalAmountGrand
                                : styles.cellTextEmpty
                            }
                            numberOfLines={1}>
                            {formatCellValue(report.totalUpiCollected)}
                          </Text>
                        </View>
                        <View style={styles.totalFooterCell}>
                          <Text
                            style={
                              report.grandTotal ? styles.totalAmountGrand : styles.cellTextEmpty
                            }
                            numberOfLines={1}>
                            {formatCellValue(report.grandTotal)}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </>
      )}

      {viewMode === 'settlements' && (
        <ScrollView
          style={styles.settlementsSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.settlementsList}>
          {/* Cash reconciliation for the agent's own book — settlement never erases
              collection history, it only moves the unsettled balance. */}
          <View style={styles.settlementCard}>
            <Text style={styles.settlementSummaryTitle}>
              {t('monthlyCollections.cashReconciliation', {
                scope: t('monthlyCollections.primaryBook'),
                routes: t('monthlyCollections.allRoutes'),
              })}
            </Text>

            <View style={styles.settlementAmountRow}>
              <Text style={styles.settlementAmountLabel}>
                {t('monthlyCollections.cashCollected')}
              </Text>
              <Text style={styles.settlementAmountValue}>
                ₹{formatNumber(report.settlement.cashCollected)}
              </Text>
            </View>

            <View style={styles.settlementAmountRow}>
              <Text style={styles.settlementAmountLabel}>
                {t('monthlyCollections.upiCollected')}
              </Text>
              <Text style={styles.settlementAmountValue}>
                ₹{formatNumber(report.settlement.upiCollected)}
              </Text>
            </View>

            <View style={styles.settlementAmountRow}>
              <Text style={styles.settlementAmountLabel}>
                {t('monthlyCollections.settledCash')}
              </Text>
              <Text style={styles.settlementAmountValue}>
                ₹{formatNumber(report.settlement.settledCash)}
              </Text>
            </View>

            <View style={styles.settlementAmountRow}>
              <Text style={styles.settlementAmountLabel}>
                {t('monthlyCollections.unsettledCashInHand')}
              </Text>
              <Text style={styles.settlementAmountValueStrong}>
                ₹{formatNumber(report.settlement.cashInHand)}
              </Text>
            </View>
          </View>

          {monthSettlements.length > 0 ? (
            monthSettlements.map(settlement => {
              const statusColor =
                settlement.status === 'APPROVED'
                  ? theme.colors.status.success
                  : settlement.status === 'REJECTED'
                    ? theme.colors.status.error
                    : settlement.status === 'SUBMITTED'
                      ? theme.colors.brand.primary
                      : theme.colors.status.warning;

              const dateLabel = (() => {
                const [y, m, d] = settlement.businessDate.split('-').map(Number);
                if (!y || !m || !d) return settlement.businessDate;
                return formatDate(new Date(y, m - 1, d), language, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              })();

              return (
                <Pressable
                  key={settlement.id}
                  onPress={() => navigateToSettlementDetail(settlement.id)}
                  style={({ pressed }) => [
                    styles.settlementCard,
                    { borderLeftColor: statusColor, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <View style={styles.settlementTopRow}>
                    <Text style={styles.settlementDate}>{dateLabel}</Text>
                    <Text style={[styles.settlementStatus, { color: statusColor }]}>
                      {t(`settlementStatus.${settlement.status}` as TranslationKey)}
                    </Text>
                  </View>

                  <Text style={styles.settlementScope}>
                    {t(`settlementScope.${settlement.scope}` as TranslationKey)}
                  </Text>

                  <View style={styles.settlementAmountRow}>
                    <Text style={styles.settlementAmountLabel}>{t('monthlyCollections.cash')}</Text>
                    <Text style={styles.settlementAmountValue}>
                      ₹{formatNumber(settlement.cashTotal)}
                    </Text>
                  </View>

                  <View style={styles.settlementAmountRow}>
                    <Text style={styles.settlementAmountLabel}>{t('monthlyCollections.upi')}</Text>
                    <Text style={styles.settlementAmountValue}>
                      ₹{formatNumber(settlement.upiTotal)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyText}>{t('monthlyCollections.emptySettlements')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <BottomSheet isOpen={activePicker !== null} onClose={() => setActivePicker(null)}>
        {activePicker === 'pdfActions' ? (
          <View style={styles.pdfActions}>
            <Text style={styles.pdfActionsTitle}>{t('pdf.readyTitle')}</Text>
            <Text style={styles.pdfActionsMessage}>{t('pdf.readyMessage')}</Text>
            <View style={styles.pdfActionsRow}>
              {(
                [
                  {
                    key: 'preview',
                    label: t('pdf.preview'),
                    icon: 'eye-outline' as const,
                    onPress: handlePreviewPdf,
                    primary: true,
                  },
                  {
                    key: 'share',
                    label: t('pdf.share'),
                    icon: 'share-outline' as const,
                    onPress: handleSharePdf,
                    primary: true,
                  },
                  {
                    key: 'save',
                    label: t('pdf.save'),
                    icon: 'download-outline' as const,
                    onPress: handleSavePdf,
                    primary: false,
                  },
                  {
                    key: 'cancel',
                    label: t('common.cancel'),
                    icon: 'close-outline' as const,
                    onPress: () => setActivePicker(null),
                    primary: false,
                  },
                ] as const
              ).map(action => (
                <Pressable
                  key={action.key}
                  onPress={action.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  style={({ pressed }) => [styles.pdfActionButton, { opacity: pressed ? 0.7 : 1 }]}>
                  <View
                    style={[
                      styles.pdfActionIconWrap,
                      action.primary && styles.pdfActionIconWrapPrimary,
                    ]}>
                    <Ionicons
                      name={action.icon}
                      size={22}
                      color={action.primary ? '#FFFFFF' : theme.colors.brand.primary}
                    />
                  </View>
                  <Text style={styles.pdfActionLabel} numberOfLines={1}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : activePicker === 'route' ? (
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>{t('monthlyCollections.selectRoute')}</Text>
            <View style={styles.pickerOptionsList}>
              <Pressable
                onPress={() => handleRouteChange(null)}
                style={({ pressed }) => [
                  styles.pickerOption,
                  !routeFilter && styles.pickerOptionSelected,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <Text
                  style={[
                    styles.pickerOptionText,
                    !routeFilter && styles.pickerOptionTextSelected,
                  ]}>
                  {t('monthlyCollections.allRoutes')}
                </Text>
              </Pressable>

              {routeOptions.map(route => {
                const isSelected = route.id === routeFilter;
                return (
                  <Pressable
                    key={route.id}
                    onPress={() => handleRouteChange(route.id)}
                    style={({ pressed }) => [
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}>
                      {route.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>{t('monthlyCollections.selectMonth')}</Text>
            <View style={styles.pickerOptionsList}>
              {monthOptions.map((date, index) => {
                const isSelected =
                  date.getMonth() === currentMonthIndex && date.getFullYear() === currentYear;
                const label = formatDate(date, language, {
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleMonthChange(date)}
                    style={({ pressed }) => [
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
