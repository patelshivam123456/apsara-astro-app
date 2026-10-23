import { HoroscopeScreen } from "@/screens/client/HoroscopeScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function AstrologerMyHoroscope() {
  return <LoginRequired><HoroscopeScreen /></LoginRequired>;
}
