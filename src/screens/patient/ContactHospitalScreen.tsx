import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone,
  Ambulance,
  Mail,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'ContactHospital'>;

const DEPARTMENTS = [
  { name: 'Emergency & Trauma Desk', hours: '24 Hours / 7 Days', ext: 'Ext. 100' },
  { name: 'OPD Appointment Reception', hours: '08:00 AM - 08:00 PM', ext: 'Ext. 201' },
  { name: 'Diagnostic Lab & Imaging', hours: '07:00 AM - 10:00 PM', ext: 'Ext. 305' },
  { name: '24/7 In-House Pharmacy', hours: '24 Hours / 7 Days', ext: 'Ext. 402' },
];

export const ContactHospitalScreen: React.FC<Props> = ({ navigation }) => {
  const openExternal = async (url: string, fallbackTitle: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(fallbackTitle, `Contact endpoint: ${url}`);
      }
    } catch {
      Alert.alert(fallbackTitle, `Contact endpoint: ${url}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Contact Hospital"
        subtitle="Star Hospital 24/7 Care"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Banner */}
        <StarCard style={styles.emergencyCard} variant="elevated">
          <View style={styles.emergencyRow}>
            <View style={styles.emergencyIcon}>
              <Ambulance size={26} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>24/7 Emergency & Ambulance</Text>
              <Text style={styles.emergencyPhone}>+92 51 111 782 911</Text>
            </View>
          </View>
          <StarButton
            title="Call Emergency Helpline"
            variant="danger"
            onPress={() => openExternal('tel:+9251111782911', 'Emergency Desk')}
            fullWidth
          />
        </StarCard>

        {/* Primary Contact Channels */}
        <StarCard style={styles.sectionCard} variant="elevated">
          <Text style={styles.sectionTitle}>Direct Contact Channels</Text>

          <TouchableOpacity
            onPress={() => openExternal('tel:+92512224400', 'OPD Reception')}
            style={styles.contactRow}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <Phone size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>OPD Reception & Appointments</Text>
              <Text style={styles.contactValue}>+92 51 222 4400</Text>
            </View>
            <ExternalLink size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              openExternal('mailto:care@starhospital.com', 'Hospital Support Email')
            }
            style={styles.contactRow}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <Mail size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Patient Care Email</Text>
              <Text style={styles.contactValue}>care@starhospital.com</Text>
            </View>
            <ExternalLink size={16} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconBox}>
              <MapPin size={18} color={colors.tealAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Hospital Campus Address</Text>
              <Text style={styles.contactValue}>
                Plot 14, Healthcare Avenue, Sector G-8/3, Islamabad
              </Text>
            </View>
          </View>
        </StarCard>

        {/* Department Timings */}
        <StarCard style={styles.sectionCard} variant="elevated">
          <View style={styles.deptHeader}>
            <Building2 size={18} color={colors.primary} />
            <Text style={styles.sectionTitleInline}>Department Timings</Text>
          </View>

          {DEPARTMENTS.map((dept, index) => (
            <View
              key={dept.name}
              style={[
                styles.deptRow,
                index === DEPARTMENTS.length - 1 ? { borderBottomWidth: 0 } : undefined,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.deptName}>{dept.name}</Text>
                <View style={styles.hoursRow}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={styles.deptHours}>{dept.hours}</Text>
                </View>
              </View>
              <Text style={styles.deptExt}>{dept.ext}</Text>
            </View>
          ))}
        </StarCard>

        <StarButton
          title="Book an Outpatient Visit"
          onPress={() => navigation.navigate('BookAppointment')}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  emergencyCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    gap: spacing.md,
  },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emergencyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: { ...typography.labelLarge, color: colors.textPrimary },
  emergencyPhone: { ...typography.h3, color: colors.danger, marginTop: 2 },
  sectionCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  sectionTitleInline: { ...typography.h4, color: colors.textPrimary },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { ...typography.caption, color: colors.textSecondary },
  contactValue: { ...typography.labelLarge, color: colors.textPrimary, marginTop: 2 },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  deptName: { ...typography.labelMedium, color: colors.textPrimary },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  deptHours: { ...typography.caption, color: colors.textSecondary },
  deptExt: {
    ...typography.labelSmall,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
});
