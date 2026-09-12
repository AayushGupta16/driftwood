import { lazy, Suspense } from "react";
import SettingsTabs from "./SettingsTabs";
const SendScheduleSettings = lazy(() => import("./SendScheduleSettings"));
const ApprovalSettings = lazy(() => import("../approvals/ApprovalSettings"));
const SendingAccountSettings = lazy(() => import("../Dashboard").then((module) => ({ default: module.SendingAccountSettings })));
export default function Settings() {
 const tab = new URLSearchParams(window.location.search).get("tab");
 const active = tab === "approvals" ? "Approvals" : tab === "accounts" ? "Sending accounts" : "Send schedule";
 return <><SettingsTabs active={active} /><Suspense fallback={<p role="status">Loading settings…</p>}>{tab === "approvals" ? <ApprovalSettings /> : tab === "accounts" ? <SendingAccountSettings /> : <SendScheduleSettings />}</Suspense></>;
}
