import { NumerologyAccess } from "@/components/NumerologyAccess";
import { NumerologyScreen } from "@/screens/astrologer/NumerologyScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function Numerology() {
  return <LoginRequired><NumerologyAccess><NumerologyScreen /></NumerologyAccess></LoginRequired>;
}
