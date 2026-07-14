import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "@/context/LanguageContext";
import { NumberRelationshipItem } from "@/services/numerology.service";

import { styles } from "./styles";
import { findRelationship, getRelationStatus, localizeDigitsInText } from "./utils";

export function RelationTable({
  relationships,
  personalityNo,
  destinyNo
}: {
  relationships: NumberRelationshipItem[];
  personalityNo?: number;
  destinyNo?: number;
}) {
  const { language, t } = useTranslation();
  const relationRows = [
    { label: "Personality", number: personalityNo, relationship: findRelationship(relationships, personalityNo) },
    { label: "Destiny", number: destinyNo, relationship: findRelationship(relationships, destinyNo) }
  ];
  const relationStatus = getRelationStatus(relationships, personalityNo, destinyNo);

  return (
    <ScrollView >
      <View style={styles.relationTable}>
        <View style={styles.relationHeader}>
          <Text style={[styles.relationHeadText, styles.relationNumberHead]}>{t("Number")}</Text>
          <Text style={[styles.relationHeadText, styles.relationFriendHead]}>{t("Friend")}</Text>
          <Text style={[styles.relationHeadText, styles.relationEnemyHead]}>{t("Enemy")}</Text>
          <Text style={[styles.relationHeadText, styles.relationNeutralHead]}>{t("Neutral")}</Text>
        </View>
        {relationRows.map(({ label, number, relationship }) => (
          <View key={label} style={styles.relationRow}>
            <Text style={[styles.relationLabel, styles.relationNameCell]}>{t(label)}</Text>
            <Text style={[styles.relationCell, styles.relationNumberCell]}>{localizeDigitsInText(number ?? "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationFriendCell, styles.friendText]}>{localizeDigitsInText(relationship?.friendNumbers || "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationEnemyCell, styles.enemyText]}>{localizeDigitsInText(relationship?.enemyNumbers || "-", language)}</Text>
            <Text style={[styles.relationCell, styles.relationNeutralCell, styles.neutralText]}>{localizeDigitsInText(relationship?.neutralNumbers || "-", language)}</Text>
          </View>
        ))}
        <View style={styles.relationFoot}>
          <Text style={[styles.relationLabel, styles.relationFootLabel]}>{t("Relation in Personality\n& Destiny Number")}</Text>
          <Text style={styles.relationFootValue}>
            {localizeDigitsInText(`${personalityNo ?? "-"}:${destinyNo ?? "-"}`, language)} = {t(relationStatus)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
