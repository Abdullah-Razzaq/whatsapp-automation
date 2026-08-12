'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

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

    // Subscribe to leads table changes
    const leadsChannel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        fetchLeads();
        // If the updated lead is the active one, update it
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

      // Subscribe to messages table changes for active lead
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
    <div className="flex h-screen bg-gray-100 text-slate-800">
      {/* LEFT SIDEBAR: Leads Roster */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-4">Inbox</h2>
          <input 
            type="text" 
            placeholder="Search by phone or status..." 
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingLeads ? (
            <div className="p-8 text-center text-gray-500">Loading leads...</div>
          ) : leadsError ? (
            <div className="p-8 text-center text-red-500">Error: {leadsError}</div>
          ) : (
            <>
              {(filteredLeads || []).map(lead => (
                <div 
                  key={lead.id} 
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${activeLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setActiveLead(lead)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{lead.phone_number || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">
                      {lead.updated_at ? new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${lead.status === 'NEEDS_HUMAN' ? 'bg-red-100 text-red-700 font-semibold' : 'bg-gray-100 text-gray-600'}`}>
                      {lead.status || 'NEW'}
                    </span>
                    {lead.is_ai_enabled && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">
                        AI Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && <div className="p-8 text-gray-500 text-center">No leads found.</div>}
            </>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Chat Canvas */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeLead ? (
          <>
            {/* Header Controls */}
            <div className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shrink-0">
              <div>
                <h3 className="font-bold text-lg">{activeLead.phone_number}</h3>
                <span className="text-sm text-gray-500">
                  {activeLead.metadata?.category ? `Category: ${activeLead.metadata.category}` : 'No category'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">AI Auto-Pilot:</span>
                  <button 
                    onClick={toggleAiPilot}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${activeLead.is_ai_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${activeLead.is_ai_enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <select 
                  className="p-2 border border-gray-300 rounded text-sm bg-white"
                  value={activeLead.status || 'NEW'}
                  onChange={(e) => updateStatus(e.target.value)}
                >
                  <option value="NEW">NEW</option>
                  <option value="NEEDS_HUMAN">NEEDS_HUMAN</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="text-center text-gray-500 py-4">Loading messages...</div>
              ) : messagesError ? (
                <div className="text-center text-red-500 py-4">Error: {messagesError}</div>
              ) : (
                <>
                  {(messages || []).map(msg => {
                    const isUser = msg.sender === 'USER';
                    const isAI = msg.sender === 'AI';
                    const isAgent = msg.sender === 'AGENT';
                    
                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg shadow-sm
                          ${isUser ? 'bg-white border border-gray-200 text-gray-800' : ''}
                          ${isAI ? 'bg-blue-100 text-blue-900 border border-blue-200' : ''}
                          ${isAgent ? 'bg-blue-600 text-white' : ''}
                        `}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={`text-right text-[10px] mt-1 ${isAgent ? 'text-blue-200' : 'text-gray-400'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} • {msg.sender}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a lead from the sidebar to view the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
