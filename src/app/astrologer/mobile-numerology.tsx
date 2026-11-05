import { NumerologyAccess } from "@/components/NumerologyAccess";
import { LoginRequired } from "@/components/LoginRequired";
import { MobileNumerologyScreen } from "@/components/Numerology/MobileNumerology";

export default function ProtectedNumerology() {
  return <LoginRequired><NumerologyAccess><MobileNumerologyScreen /></NumerologyAccess></LoginRequired>;
}
