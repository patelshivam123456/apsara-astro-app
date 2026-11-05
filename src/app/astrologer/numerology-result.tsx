import { NumerologyAccess } from "@/components/NumerologyAccess";
import { LoginRequired } from "@/components/LoginRequired";
import { NumerologyResultScreen } from "@/components/Numerology/Lushu-grid";

export default function ProtectedNumerology() {
  return <LoginRequired><NumerologyAccess><NumerologyResultScreen /></NumerologyAccess></LoginRequired>;
}
