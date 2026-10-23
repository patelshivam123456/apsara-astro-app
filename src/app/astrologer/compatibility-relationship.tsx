import { CompatibilityRelationshipScreen } from "@/components/Numerology/Compatibility";
import { LoginRequired } from "@/components/LoginRequired";

export default function CompatibilityRelationship() {
  return <LoginRequired><CompatibilityRelationshipScreen /></LoginRequired>;
}
