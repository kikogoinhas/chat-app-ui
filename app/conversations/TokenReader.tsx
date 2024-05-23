"use client";

import { useContext } from "react";
import { AuthTokenContext } from "../components/context";

export default function TokenReader() {
  const token = useContext(AuthTokenContext);
  return <div className="overflow-ellipsis">{token}</div>;
}
