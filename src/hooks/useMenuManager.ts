import type { MenuType } from "../types/game";

// hooks/useMenuManager.ts
const useMenuManager = () => {
  const [activeMenu, setActiveMenu] = useState<'quests' | 'artDealer' | null>(null);
  
  const openMenu = (menu: MenuType) => setActiveMenu(menu);
  const closeMenu = () => setActiveMenu(null);
  
  return { activeMenu, openMenu, closeMenu };
};