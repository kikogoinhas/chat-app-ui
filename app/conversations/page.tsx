import { cookies } from "next/headers";
import { CookieId } from "../lib/session/cookies";
import AuthTokenProvider from "./AuthTokenProvider";
import TokenReader from "./TokenReader";

export default function Home() {
  const cookie = cookies().get(CookieId.SESSION_ID);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-16">
      <h1>Coversations</h1>
      {cookie?.value}
      <AuthTokenProvider>
        <TokenReader />
      </AuthTokenProvider>
    </main>
  );
}
