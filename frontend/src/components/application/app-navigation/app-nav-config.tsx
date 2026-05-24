import {
    HomeLine,
    Target02,
    FileCheck02,
    File02,
    Users01,
} from "@untitledui/icons";
import type { NavItemType, NavItemDividerType } from "./config";

export const appNavItems: (NavItemType | NavItemDividerType)[] = [
    {
        label: "Dashboard",
        href: "/",
        icon: HomeLine,
    },
    {
        label: "Leads",
        href: "/leads",
        icon: Target02,
    },
    {
        label: "Tasks",
        href: "/tasks",
        icon: FileCheck02,
    },
    {
        label: "Quotations",
        href: "/quotations",
        icon: File02,
    },
    {
        label: "Users",
        href: "/users",
        icon: Users01,
    },
];
