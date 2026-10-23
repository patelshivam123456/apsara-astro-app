import { KundaliPdfScreen } from "@/screens/client/KundaliPdfScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function KundaliPdf() {
  return <LoginRequired><KundaliPdfScreen /></LoginRequired>;
}
