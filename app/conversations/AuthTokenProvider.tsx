"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { AuthTokenContext } from "@/app/components/context";

export default function AuthTokenProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState("");

  useEffect(() => {
    fetchAccessToken();
  }, [value]);

  async function fetchAccessToken() {
    const url = `${window.location.origin}/api/auth`;
    const response = await window.fetch(url);
    const { access_token } = await response.json();

    setValue(access_token);
  }

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}
