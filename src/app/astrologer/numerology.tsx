import { NumerologyScreen } from "@/screens/astrologer/NumerologyScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function Numerology() {
  return <LoginRequired><NumerologyScreen /></LoginRequired>;
}
