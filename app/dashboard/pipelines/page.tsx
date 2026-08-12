'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, BarChart2, Plus, Phone, MessageCircle, Clock, Bot, User, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type Lead = {
  id: string;
  name: string;
  phone_number: string;
  deal_value: number;
  stage: 'LEAD' | 'BUSY' | 'CALL_BACK' | 'INTERESTED' | 'WON';
  is_ai_enabled: boolean;
  updated_at: string;
};

const STAGES = [
  { id: 'LEAD', title: 'Lead', color: 'text-yellow-700', bgHeader: 'bg-yellow-100', borderLeft: 'border-l-yellow-400' },
  { id: 'BUSY', title: 'Busy', color: 'text-purple-700', bgHeader: 'bg-purple-100', borderLeft: 'border-l-purple-400' },
  { id: 'CALL_BACK', title: 'Call Back Request', color: 'text-amber-700', bgHeader: 'bg-amber-100', borderLeft: 'border-l-amber-400' },
  { id: 'INTERESTED', title: 'Interested', color: 'text-green-700', bgHeader: 'bg-green-100', borderLeft: 'border-l-green-400' },
  { id: 'WON', title: 'Won', color: 'text-teal-700', bgHeader: 'bg-teal-100', borderLeft: 'border-l-teal-400' }
] as const;

export default function PipelinesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone_number: '', deal_value: 0, stage: 'LEAD' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('updated_at', { ascending: false });
    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalValue = leads.reduce((sum, item) => sum + (Number(item.deal_value) || 0), 0);
  const totalLeads = leads.length;

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;
    
    // Optimistic update
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: targetStage as any } : l));

    await supabase
      .from('leads')
      .update({ stage: targetStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage as any } : l));
    await supabase.from('leads').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', leadId);
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    setLeads(leads.filter(l => l.id !== leadId));
    await supabase.from('leads').delete().eq('id', leadId);
  };

  const openEditModal = (lead: Lead) => {
    setEditLeadId(lead.id);
    setFormData({ name: lead.name || '', phone_number: lead.phone_number, deal_value: lead.deal_value || 0, stage: lead.stage });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditLeadId(null);
    setFormData({ name: '', phone_number: '', deal_value: 0, stage: 'LEAD' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editLeadId) {
      await supabase.from('leads').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editLeadId);
    } else {
      await supabase.from('leads').insert([{ ...formData, is_ai_enabled: true }]);
    }
    setIsModalOpen(false);
    fetchLeads();
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

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
          
          <div className="w-px h-8 bg-slate-300 mx-1"></div>

          <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5">
            <Plus className="w-4 h-4 mr-1.5" /> Add Opportunity
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-6 gap-6 items-start w-max">
          
          {STAGES.map((stage) => {
            const stageItems = leads.filter(l => (l.stage || 'LEAD') === stage.id);
            const stageValue = stageItems.reduce((sum, item) => sum + (Number(item.deal_value) || 0), 0);
            
            return (
              <div 
                key={stage.id} 
                className="w-[320px] flex flex-col h-full bg-slate-100/50 rounded-xl border border-slate-200/60 shadow-sm"
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragOver={handleDragOver}
              >
                
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-slate-200 rounded-t-xl ${stage.bgHeader} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${stage.color}`}>{stage.title}</h3>
                    <span className="bg-white/60 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                      {stageItems.length}
                    </span>
                  </div>
                  <div className={`text-xs font-bold opacity-80 ${stage.color}`}>
                    {formatPKR(stageValue)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {stageItems.map((item) => (
                    <div 
                      key={item.id}
                      draggable 
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 ${stage.borderLeft} border-l-4 cursor-grab hover:shadow-md transition-shadow relative group`}
                    >
                      {/* Context Menu */}
                      <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                         <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 text-[15px] truncate pr-16">{item.name || item.phone_number}</div>
                      </div>
                      
                      <div className="text-sm font-extrabold text-slate-600 mb-2">
                        {Number(item.deal_value) > 0 ? formatPKR(Number(item.deal_value)) : 'Value TBD'}
                      </div>
                      
                      <div className="mb-3">
                         <select 
                            value={item.stage} 
                            onChange={(e) => handleStageChange(item.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded py-1 px-2 text-slate-600 font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                         >
                            {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                         </select>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-300" />
                          Updated {getTimeAgo(item.updated_at)}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {item.is_ai_enabled ? (
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
                  
                  {stageItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      <span className="text-slate-400 text-xs font-semibold">Drop here</span>
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h2 className="text-lg font-bold text-slate-800">{editLeadId ? 'Edit Opportunity' : 'Add Opportunity'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="e.g. Acme Corp" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input required type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="+923001234567" disabled={!!editLeadId} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deal Value (PKR)</label>
                    <input required type="number" value={formData.deal_value} onChange={e => setFormData({...formData, deal_value: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Stage</label>
                    <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                       {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-yellow-400 text-yellow-950 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-sm">Save Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
