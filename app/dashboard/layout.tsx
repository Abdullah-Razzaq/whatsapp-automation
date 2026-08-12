'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart2, 
  MessageSquare, 
  GitMerge, 
  Users, 
  Bot, 
  Zap, 
  Megaphone, 
  Wrench,
  Bell,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Analytics', href: '/dashboard', icon: BarChart2 },
    { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare, badge: 3 },
    { name: 'Pipelines', href: '/dashboard/pipelines', icon: GitMerge },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'AI Center', href: '/dashboard/ai-center', icon: Bot },
    { name: 'Flows', href: '/dashboard/flows', icon: Zap },
    { name: 'Broadcasts', href: '/dashboard/broadcasts', icon: Megaphone },
    { name: 'Tools', href: '/dashboard/tools', icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-[2px_0_8px_-3px_rgba(0,0,0,0.05)] shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-white mr-3 shadow-sm bg-gradient-to-br from-yellow-400 to-amber-500">
            W
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">The WhatBot</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-yellow-50 text-yellow-700 font-semibold shadow-sm ring-1 ring-yellow-200/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-yellow-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 z-10 relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center">
            <button className="flex items-center text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 hover:border-slate-300">
              App: Production Bot
              <ChevronDown className="w-4 h-4 ml-1.5 text-slate-400" />
            </button>
          </div>
          <div className="flex items-center space-x-5">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 cursor-pointer shadow-sm text-xs">
              AR
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto w-full h-full relative">
          {children}
        </main>
      </div>
    </div>
  );
}
