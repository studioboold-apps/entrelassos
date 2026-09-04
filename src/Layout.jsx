import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, MessageCircle, Calendar, Award, User, Users } from 'lucide-react';
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
          --background: 0 0% 4%;
          --foreground: 0 0% 95%;
          --card: 0 0% 7%;
          --card-foreground: 0 0% 95%;
          --popover: 0 0% 7%;
          --popover-foreground: 0 0% 95%;
          --primary: 45 93% 58%;
          --primary-foreground: 0 0% 4%;
          --secondary: 0 0% 12%;
          --secondary-foreground: 0 0% 95%;
          --muted: 0 0% 12%;
          --muted-foreground: 0 0% 60%;
          --accent: 0 0% 12%;
          --accent-foreground: 0 0% 95%;
          --destructive: 0 62% 50%;
          --destructive-foreground: 0 0% 95%;
          --border: 0 0% 15%;
          --input: 0 0% 15%;
          --ring: 45 93% 58%;
        }
      `}</style>
      
      <main>{children}</main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-2 pb-safe">
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
                      ? "text-blue-400" 
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