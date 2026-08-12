'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Search, Send, Paperclip, CheckCircle2, User, Bot, UserCog, MoreVertical, Phone, MessageSquare } from 'lucide-react';

type Lead = {
  id: string;
  phone_number: string;
  status: string;
  is_ai_enabled: boolean;
  metadata: any;
  updated_at: string;
};

type Message = {
  id: string;
  lead_id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  content: string;
  created_at: string;
};

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeads();

    const leadsChannel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        fetchLeads();
        if (payload.new && (payload.new as Lead).id === activeLead?.id) {
          setActiveLead(payload.new as Lead);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [activeLead?.id]);

  useEffect(() => {
    if (activeLead) {
      fetchMessages(activeLead.id);

      const messagesChannel = supabase
        .channel('public:messages')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `lead_id=eq.${activeLead.id}`
          }, 
          (payload) => {
          setMessages(prev => [...(prev || []), payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    } else {
      setMessages([]);
    }
  }, [activeLead]);

  useEffect(() => {
    const filtered = (leads || []).filter(lead => {
      const phone = lead.phone_number || '';
      const status = lead.status || '';
      return phone.includes(searchQuery) || status.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredLeads(filtered);
  }, [searchQuery, leads]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error(err);
      setLeadsError(err.message || 'Failed to fetch leads');
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error(err);
      setMessagesError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeLead) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: activeLead.phone_number,
          messageText: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
      } else {
        console.error('Failed to send message');
        alert('Failed to send message');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleAiPilot = async () => {
    if (!activeLead) return;
    const newStatus = !activeLead.is_ai_enabled;
    const { error } = await supabase
      .from('leads')
      .update({ is_ai_enabled: newStatus })
      .eq('id', activeLead.id);
      
    if (error) {
      console.error(error);
      alert('Failed to update AI pilot status');
    } else {
      setActiveLead({ ...activeLead, is_ai_enabled: newStatus });
    }
  };

  const updateStatus = async (status: string) => {
    if (!activeLead) return;
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', activeLead.id);

    if (error) {
      console.error(error);
      alert('Failed to update status');
    } else {
      setActiveLead({ ...activeLead, status });
    }
  };

  return (
    <div className="flex h-full bg-white text-slate-800 rounded-tl-xl border-l border-t border-slate-200 overflow-hidden shadow-sm">
      {/* LEFT SIDEBAR: Leads Roster */}
      <div className="w-[320px] bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0 z-0 relative shadow-[2px_0_10px_-3px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100/70 border border-transparent rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingLeads ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading contacts...</div>
          ) : leadsError ? (
            <div className="p-8 text-center text-red-500 text-sm font-medium">{leadsError}</div>
          ) : (
            <div className="p-3 space-y-2">
              {(filteredLeads || []).map(lead => {
                const isActive = activeLead?.id === lead.id;
                return (
                  <div 
                    key={lead.id} 
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-yellow-50 border-yellow-200 shadow-sm ring-1 ring-yellow-400/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveLead(lead)}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="font-bold text-slate-900 text-[15px] flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {lead.phone_number || 'Unknown'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wide">
                        {lead.updated_at ? new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        lead.status === 'NEEDS_HUMAN' ? 'bg-red-50 text-red-700 border-red-200' : 
                        lead.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        lead.status === 'CLOSED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {lead.status === 'NEEDS_HUMAN' ? 'NEEDS HUMAN' : (lead.status || 'NEW')}
                      </span>
                      {lead.is_ai_enabled && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-white font-bold uppercase tracking-wider flex items-center shadow-sm">
                          <Bot className="w-3 h-3 mr-1 text-yellow-400" /> AI ON
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredLeads.length === 0 && <div className="p-8 text-slate-500 text-center text-sm font-medium">No contacts found.</div>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Chat Canvas */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {activeLead ? (
          <>
            {/* Header Controls */}
            <div className="h-20 bg-white border-b border-slate-200 flex justify-between items-center px-8 shrink-0 z-10 shadow-sm relative">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 border border-slate-200 shadow-sm">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">{activeLead.phone_number}</h3>
                  <div className="flex items-center text-xs font-semibold text-slate-500 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm border border-white"></span>
                    Online on WhatsApp
                    {activeLead.metadata?.category && (
                       <span className="ml-2 text-slate-400">| {activeLead.metadata.category}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Pilot</span>
                  <button 
                    onClick={toggleAiPilot}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${activeLead.is_ai_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${activeLead.is_ai_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                  <select 
                    className="pl-4 pr-10 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold text-slate-800 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm appearance-none outline-none hover:border-slate-400 transition-colors"
                    value={activeLead.status || 'NEW'}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option value="NEW">New Lead</option>
                    <option value="NEEDS_HUMAN">Needs Human</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-10 w-10 bg-slate-200 rounded-full mb-3"></div>
                    <div className="text-slate-400 text-sm font-semibold tracking-wide">LOADING CONVERSATION...</div>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="text-center text-red-500 py-4 text-sm font-bold bg-red-50 rounded-xl border border-red-100 mx-10 shadow-sm">{messagesError}</div>
              ) : (
                <>
                  <div className="text-center my-6">
                    <span className="bg-white text-slate-400 text-[10px] font-bold px-4 py-1.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-widest">
                      Conversation Started
                    </span>
                  </div>
                  {(messages || []).map(msg => {
                    const isUser = msg.sender === 'USER';
                    const isAI = msg.sender === 'AI';
                    const isAgent = msg.sender === 'AGENT';
                    
                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'} group`}>
                        {isUser && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 shrink-0 self-end mb-2 shadow-sm border border-slate-300">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm relative group-hover:shadow-md transition-shadow
                          ${isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none' : ''}
                          ${isAI ? 'bg-blue-50 text-blue-950 border border-blue-200 rounded-br-none' : ''}
                          ${isAgent ? 'bg-slate-800 text-white rounded-br-none' : ''}
                        `}>
                          {!isUser && (
                            <div className={`absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wider flex items-center border shadow-sm
                               ${isAI ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-700 text-slate-200 border-slate-600'}
                            `}>
                              {isAI ? <Bot className="w-3.5 h-3.5 mr-1" /> : <UserCog className="w-3.5 h-3.5 mr-1" />}
                              {isAI ? 'AI ASSISTANT' : 'HUMAN AGENT'}
                            </div>
                          )}
                          <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${!isUser ? 'mt-1.5' : ''}`}>{msg.content}</p>
                          <div className={`text-right text-[10px] mt-2.5 font-bold flex items-center justify-end gap-1.5 ${isAgent ? 'text-slate-400' : 'text-slate-400'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            {!isUser && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-4" />
                </>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-6 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] relative z-10">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-5xl mx-auto">
                <button type="button" className="p-3.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 mb-0.5">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a response... (Press Enter to send)"
                    className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none h-[60px] max-h-[150px] shadow-sm text-[15px] font-medium text-slate-700 placeholder:text-slate-400 transition-shadow"
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="p-4 bg-yellow-400 text-yellow-950 rounded-xl font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-sm flex items-center justify-center h-[60px] w-[60px] mb-0.5 hover:shadow-md hover:-translate-y-0.5"
                  disabled={isSending || !newMessage.trim()}
                >
                  <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : 'ml-1'}`} />
                </button>
              </form>
              <div className="text-center mt-3">
                <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  Sending as human agent. <strong className="text-slate-500">AI pilot will be paused</strong> if you reply manually.
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
              <MessageSquare className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700 mb-2 tracking-tight">Your Inbox is Empty</h3>
            <p className="text-sm font-medium text-slate-500">Select a contact from the left sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
