import { MatchMakingPdfScreen } from "@/screens/client/MatchMakingPdfScreen";
import { LoginRequired } from "@/components/LoginRequired";

export default function MatchMakingPdf() {
  return <LoginRequired><MatchMakingPdfScreen /></LoginRequired>;
}
