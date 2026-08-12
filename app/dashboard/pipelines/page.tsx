'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown, BarChart2, Plus, Phone, MessageCircle, Clock, Bot, User } from 'lucide-react';

type KanbanItem = {
  id: string;
  name: string;
  value: number;
  timeAgo: string;
  isAiAssigned: boolean;
  channel: 'whatsapp' | 'instagram' | 'messenger';
};

type Stage = {
  id: string;
  title: string;
  color: string;
  bgHeader: string;
  borderLeft: string;
  items: KanbanItem[];
};

const DUMMY_STAGES: Stage[] = [
  {
    id: 'lead',
    title: 'Lead',
    color: 'text-yellow-700',
    bgHeader: 'bg-yellow-100',
    borderLeft: 'border-l-yellow-400',
    items: [
      { id: '1', name: 'Ali Khan', value: 50000, timeAgo: 'Updated 2 hours ago', isAiAssigned: true, channel: 'whatsapp' },
      { id: '2', name: 'Sara Ahmed', value: 125000, timeAgo: 'Updated 5 hours ago', isAiAssigned: false, channel: 'whatsapp' },
      { id: '3', name: '+92 300 1234567', value: 0, timeAgo: 'Updated 1 day ago', isAiAssigned: true, channel: 'whatsapp' },
    ]
  },
  {
    id: 'busy',
    title: 'Busy',
    color: 'text-purple-700',
    bgHeader: 'bg-purple-100',
    borderLeft: 'border-l-purple-400',
    items: [
      { id: '4', name: 'Omar Farooq', value: 30000, timeAgo: 'Updated 3 hours ago', isAiAssigned: true, channel: 'whatsapp' },
    ]
  },
  {
    id: 'callback',
    title: 'Call Back Request',
    color: 'text-amber-700',
    bgHeader: 'bg-amber-100',
    borderLeft: 'border-l-amber-400',
    items: [
      { id: '5', name: 'Zainab Bibi', value: 75000, timeAgo: 'Updated 1 hour ago', isAiAssigned: false, channel: 'whatsapp' },
      { id: '6', name: 'Tech Solutions Ltd', value: 500000, timeAgo: 'Updated 4 hours ago', isAiAssigned: false, channel: 'whatsapp' },
    ]
  },
  {
    id: 'interested',
    title: 'Interested',
    color: 'text-green-700',
    bgHeader: 'bg-green-100',
    borderLeft: 'border-l-green-400',
    items: [
      { id: '7', name: 'Hassan Raza', value: 250000, timeAgo: 'Updated 10 mins ago', isAiAssigned: false, channel: 'whatsapp' },
      { id: '8', name: 'Ayesha Malik', value: 150000, timeAgo: 'Updated 2 days ago', isAiAssigned: true, channel: 'whatsapp' },
    ]
  },
  {
    id: 'won',
    title: 'Won',
    color: 'text-teal-700',
    bgHeader: 'bg-teal-100',
    borderLeft: 'border-l-teal-400',
    items: [
      { id: '9', name: 'Mega Corp', value: 1500000, timeAgo: 'Updated 1 week ago', isAiAssigned: false, channel: 'whatsapp' },
    ]
  }
];

export default function PipelinesPage() {
  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalValue = DUMMY_STAGES.reduce((acc, stage) => acc + stage.items.reduce((sum, item) => sum + item.value, 0), 0);
  const totalLeads = DUMMY_STAGES.reduce((acc, stage) => acc + stage.items.length, 0);

  return (
    <div className="flex flex-col h-full bg-[#f4f7f6] overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Chat Automation Leads</h1>
          <div className="flex gap-2 items-center">
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-inner">
              {totalLeads} Deals
            </span>
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-extrabold border border-green-200 shadow-sm">
              {formatPKR(totalValue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search pipelines..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all w-64 shadow-sm"
            />
          </div>
          
          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm tooltip" title="Filter">
            <Filter className="w-4 h-4" />
          </button>
          
          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm tooltip" title="Sort">
            <ArrowUpDown className="w-4 h-4" />
          </button>
          
          <button className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm tooltip" title="Analytics">
            <BarChart2 className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-slate-300 mx-1"></div>

          <button className="flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5">
            <Plus className="w-4 h-4 mr-1.5" /> Add Opportunity
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-6 gap-6 items-start w-max">
          
          {DUMMY_STAGES.map((stage) => {
            const stageValue = stage.items.reduce((sum, item) => sum + item.value, 0);
            
            return (
              <div key={stage.id} className="w-[320px] flex flex-col h-full bg-slate-100/50 rounded-xl border border-slate-200/60 shadow-sm">
                
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-slate-200 rounded-t-xl ${stage.bgHeader} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${stage.color}`}>{stage.title}</h3>
                    <span className="bg-white/60 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                      {stage.items.length}
                    </span>
                  </div>
                  <div className={`text-xs font-bold opacity-80 ${stage.color}`}>
                    {formatPKR(stageValue)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {stage.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 ${stage.borderLeft} border-l-4 cursor-grab hover:shadow-md transition-shadow relative group`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 text-[15px] truncate pr-4">{item.name}</div>
                        {item.channel === 'whatsapp' && (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 absolute top-4 right-3">
                            <MessageCircle className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm font-extrabold text-slate-600 mb-3">
                        {item.value > 0 ? formatPKR(item.value) : 'Value TBD'}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-300" />
                          {item.timeAgo}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {item.isAiAssigned ? (
                            <div className="bg-blue-50 p-1 rounded border border-blue-100 tooltip" title="AI Handling">
                              <Bot className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-1 rounded border border-slate-200 tooltip" title="Human Assigned">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {stage.items.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      <span className="text-slate-400 text-xs font-semibold">Drop here</span>
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}

          {/* Add Column Button (Optional extra for realism) */}
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors shrink-0 mt-2">
            <Plus className="w-6 h-6" />
          </button>
          
        </div>
      </div>
      
    </div>
  );
}
