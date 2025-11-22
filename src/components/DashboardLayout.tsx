
import * as React from "react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ChevronLeft,
  Menu,
  Book,
  Users,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Edit,
  PlusCircle,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

export const getNavItems = (role: string): NavItem[] => {
  const navItems: NavItem[] = [];

  if (role === "student") {
    navItems.push({
      title: "Dashboard",
      href: "/student/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      roles: ["student"],
    });
    navItems.push({
      title: "Attend Quiz",
      href: "/student/attend",
      icon: <Book className="mr-2 h-4 w-4" />,
      roles: ["student"],
    });
    navItems.push({
      title: "Tests",
      href: "/student/tests",
      icon: <FileText className="mr-2 h-4 w-4" />,
      roles: ["student"],
    });
    navItems.push({
      title: "Reports",
      href: "/student/reports",
      icon: <AlertTriangle className="mr-2 h-4 w-4" />,
      roles: ["student"],
    });
  } else if (role === "teacher") {
    navItems.push({
      title: "Dashboard",
      href: "/teacher/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      roles: ["teacher"],
    });
    navItems.push({
      title: "Tests",
      href: "/teacher/tests",
      icon: <FileText className="mr-2 h-4 w-4" />,
      roles: ["teacher"],
    });
    navItems.push({
      title: "Submit Report",
      href: "/teacher/reports",
      icon: <AlertTriangle className="mr-2 h-4 w-4" />,
      roles: ["teacher"],
    });
    navItems.push({
      title: "Create Test",
      href: "/teacher/create",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      roles: ["teacher"],
    });
  } else if (role === "admin") {
    navItems.push({
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      roles: ["admin"],
    });
    navItems.push({
      title: "Users",
      href: "/admin/users",
      icon: <Users className="mr-2 h-4 w-4" />,
      roles: ["admin"],
    });
    navItems.push({
      title: "Tests",
      href: "/admin/tests",
      icon: <FileText className="mr-2 h-4 w-4" />,
      roles: ["admin"],
    });
    navItems.push({
      title: "Reports",
      href: "/admin/reports",
      icon: <AlertTriangle className="mr-2 h-4 w-4" />,
      roles: ["admin"],
    });
  }

  return navItems;
};

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-700">
      {/* Mobile Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-4 pb-4 pt-6 text-left">
            <SheetTitle>Dashboard</SheetTitle>
            <SheetDescription>
              Manage your account and preferences
            </SheetDescription>
          </SheetHeader>
          <Separator />
          <nav className="flex flex-col space-y-1 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                    isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
          <Separator />
          <div className="mt-auto px-4 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-8 w-full items-center justify-between rounded-md px-2 text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-gray-100">
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage src={`${(import.meta as any).env?.VITE_AVATAR_SERVICE || 'https://avatar.vercel.sh'}/${user?.email}.png`} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (hidden on small screens) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r md:bg-white">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 shrink-0">
            <span className="text-lg font-semibold">Dashboard</span>
          </div>
          <Separator />
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                    isActive ? "bg-gray-100 text-gray-900" : ""
                  }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
          <Separator />
          <div className="mt-auto px-4 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-8 w-full items-center justify-between rounded-md px-2 text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-gray-100">
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage src={`${(import.meta as any).env?.VITE_AVATAR_SERVICE || 'https://avatar.vercel.sh'}/${user?.email}.png`} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
