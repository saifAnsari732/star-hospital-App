import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  ArrowRight,
  Bandage,
  Bed,
  BedDouble,
  Bell,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Cross,
  Dna,
  Download,
  Droplet,
  Edit3,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  FlaskConical,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  Info,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Microscope,
  Phone,
  Pill,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Thermometer,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Video,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../../theme';

export type IconFamily = 'lucide' | 'material' | 'material-community';

export const LUCIDE_ICON_MAP = {
  activity: Activity,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  ambulance: Ambulance,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  bandage: Bandage,
  bed: Bed,
  'bed-double': BedDouble,
  bell: Bell,
  building: Building2,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  'calendar-clock': CalendarClock,
  check: Check,
  'check-circle': CheckCircle2,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clipboard: ClipboardList,
  clock: Clock,
  'credit-card': CreditCard,
  cross: Cross,
  dashboard: LayoutDashboard,
  dna: Dna,
  download: Download,
  droplet: Droplet,
  edit: Edit3,
  eye: Eye,
  'eye-off': EyeOff,
  'file-check': FileCheck,
  'file-text': FileText,
  flask: FlaskConical,
  heart: Heart,
  'heart-pulse': HeartPulse,
  home: Home,
  hospital: Hospital,
  info: Info,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  microscope: Microscope,
  phone: Phone,
  pill: Pill,
  plus: Plus,
  receipt: Receipt,
  refresh: RefreshCw,
  search: Search,
  settings: Settings,
  share: Share2,
  shield: Shield,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  stethoscope: Stethoscope,
  syringe: Syringe,
  thermometer: Thermometer,
  trash: Trash2,
  upload: Upload,
  user: User,
  'user-check': UserCheck,
  'user-cog': UserCog,
  'user-plus': UserPlus,
  users: Users,
  video: Video,
  wallet: Wallet,
  x: X,
  'x-circle': XCircle,
} as const satisfies Record<string, LucideIcon>;

export type StarIconName = keyof typeof LUCIDE_ICON_MAP;
export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];
export type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface IconBaseProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export type IconProps =
  | (IconBaseProps & {
      family?: 'lucide';
      name: StarIconName;
    })
  | (IconBaseProps & {
      family: 'material';
      name: MaterialIconName;
    })
  | (IconBaseProps & {
      family: 'material-community';
      name: MaterialCommunityIconName;
    });

/**
 * Reusable Star Hospital Icon wrapper.
 * Defaults to crisp vector icons from `lucide-react-native`, with first-class support
 * for `@expo/vector-icons` MaterialIcons and MaterialCommunityIcons when specialized
 * clinical symbols are needed.
 */
export const Icon: React.FC<IconProps> = (props) => {
  const {
    size = 24,
    color = colors.textPrimary,
    strokeWidth = 2,
    style,
    accessibilityLabel,
    testID,
  } = props;

  if (props.family === 'material') {
    return (
      <MaterialIcons
        accessibilityLabel={accessibilityLabel}
        color={color}
        name={props.name}
        size={size}
        style={style as any}
        testID={testID}
      />
    );
  }

  if (props.family === 'material-community') {
    return (
      <MaterialCommunityIcons
        accessibilityLabel={accessibilityLabel}
        color={color}
        name={props.name}
        size={size}
        style={style as any}
        testID={testID}
      />
    );
  }

  const LucideComponent = LUCIDE_ICON_MAP[props.name] ?? Info;

  return (
    <LucideComponent
      accessibilityLabel={accessibilityLabel}
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      style={style}
      testID={testID}
    />
  );
};

export default Icon;
