/**
 * CPA Packet PDF Module
 *
 * Exports all PDF-related functionality.
 */

export { CPAPacketDocument } from './components';
export { aggregateCPAPacketData } from './data-aggregator';
export { styles, colors, formatCurrency, formatDate, getEntityColor } from './styles';
export type {
  CPAPacketData,
  EntitySummary,
  DocumentChecklistItem,
  StrategyItem,
  OpenQuestion,
  LineItem,
  DocumentStatus,
  DocStatusType,
} from './types';
