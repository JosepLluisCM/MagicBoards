import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

export function UserAvatar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Don't render anything while authentication is being checked
  if (isLoading) return null;

  // Don't render if not authenticated
  if (!isAuthenticated || !user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2) // Only keep the first 2 initials
    .join("")
    .toUpperCase();

  // console.log("UserAvatar rendering with:", {
  //   userExists: !!user,
  //   avatarUrl: user.avatarUrl,
  //   avatarUrlLength: user.avatarUrl.length,
  //   name: user.name,
  // });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>{user.name}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-red-500"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
