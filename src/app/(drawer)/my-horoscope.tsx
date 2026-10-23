import { HoroscopeScreen } from "@/screens/client/HoroscopeScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function MyHoroscope() {
  return <LoginRequired><HoroscopeScreen /></LoginRequired>;
}
