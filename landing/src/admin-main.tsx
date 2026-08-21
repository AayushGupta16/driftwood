import "./mock";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Agents from "./Agents";
import Conversation from "./Conversation";
import SeoGeo from "./SeoGeo";
import "./index.css";

const requestedPath = window.location.pathname.replace(/\/+$/, "");
const path = requestedPath === "/admin.html" ? "/dashboard/admin" : requestedPath;
const page = path === "/dashboard/admin/search-visibility" || path === "/dashboard/seo-geo"
  ? <SeoGeo />
  : path.startsWith("/dashboard/admin/agents/") || path.startsWith("/dashboard/agents/")
    ? <Conversation />
    : <Agents />;

createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);
