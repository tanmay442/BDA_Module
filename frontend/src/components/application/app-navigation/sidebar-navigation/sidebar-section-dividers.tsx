import { useLocation } from "react-router-dom";
import { cx } from "@/utils/cx";
import type { NavItemDividerType, NavItemType } from "../config";
import { NavList } from "../base-components/nav-list";

interface SidebarNavigationSectionDividersProps {
    items: (NavItemType | NavItemDividerType)[];
}

export const SidebarNavigationSectionDividers = ({ items }: SidebarNavigationSectionDividersProps) => {
    const location = useLocation();

    return (
        <nav className="flex flex-1 flex-col">
            <div className="flex-1">
                <NavList activeUrl={location.pathname} items={items} />
            </div>
        </nav>
    );
};
