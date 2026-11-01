import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Calendar, Award, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Início', icon: Home, page: 'Home' },
  { name: 'Comunid.', icon: Users, page: 'Comunidade' },
  { name: 'Juntinhos', icon: Calendar, page: 'Juntinhos' },
  { name: 'Boletim', icon: Award, page: 'Boletim' },
  { name: 'Perfil', icon: User, page: 'Perfil' },
];

export default function Layout({ children, currentPageName }) {
  const showNav = currentPageName !== 'Onboarding';

  return (
    <div className="min-h-screen bg-zinc-950">
      <style>{`
        :root {
          --background: 48 22% 95%;
          --foreground: 240 27% 25%;
          --card: 0 0% 100%;
          --card-foreground: 240 27% 25%;
          --popover: 0 0% 100%;
          --popover-foreground: 240 27% 25%;
          --primary: 34 100% 47%;
          --primary-foreground: 0 0% 100%;
          --secondary: 43 26% 89%;
          --secondary-foreground: 240 27% 25%;
          --muted: 43 26% 89%;
          --muted-foreground: 241 10% 51%;
          --accent: 44 100% 55%;
          --accent-foreground: 240 27% 25%;
          --destructive: 0 72% 51%;
          --destructive-foreground: 0 0% 100%;
          --border: 43 22% 86%;
          --input: 43 22% 86%;
          --ring: 34 100% 47%;
        }
      `}</style>
      
      <main>{children}</main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg shadow-[0_-4px_16px_rgba(47,47,81,0.06)] border-t border-zinc-800 px-2 pb-safe">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full transition-all",
                    isActive 
                      ? "text-blue-600" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-[10px] mt-1",
                    isActive ? "font-medium" : "font-normal"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}