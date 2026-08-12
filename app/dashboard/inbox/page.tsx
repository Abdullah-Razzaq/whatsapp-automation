'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Search, Send, Paperclip, CheckCircle2, User, Bot, UserCog, MoreVertical, Phone, MessageSquare, Image as ImageIcon, Video, Smile, MapPin, Calendar, Clock, Tag, Plus, MessageCircle, ChevronDown, Flag, Mail } from 'lucide-react';

type Lead = {
  id: string;
  phone_number: string;
  status: string;
  is_ai_enabled: boolean;
  metadata: any;
  updated_at: string;
  created_at?: string;
};

type Message = {
  id: string;
  lead_id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  content: string;
  created_at: string;
  type?: 'text' | 'image' | 'video';
  mediaUrl?: string;
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
      
      // Mock some media messages if none exist for demonstration purposes
      let fetchedMessages = data || [];
      if (fetchedMessages.length > 0 && fetchedMessages.filter(m => m.type === 'image' || m.type === 'video').length === 0) {
        fetchedMessages = [
          ...fetchedMessages,
          {
            id: 'mock-img-1',
            lead_id: leadId,
            sender: 'USER',
            content: 'Check out this screenshot',
            created_at: new Date().toISOString(),
            type: 'image',
            mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80'
          },
          {
            id: 'mock-vid-1',
            lead_id: leadId,
            sender: 'AI',
            content: 'Here is a quick walkthrough video.',
            created_at: new Date(Date.now() + 1000).toISOString(),
            type: 'video',
            mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
          }
        ];
      }

      setMessages(fetchedMessages);
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
    <div className="flex h-full bg-slate-50 text-slate-800 border-t border-slate-200 overflow-hidden">
      
      {/* 1. LEFT PANEL: Contacts List */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-0 relative shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap">All</button>
            <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-semibold whitespace-nowrap hover:bg-slate-50">Unread</button>
            <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-semibold whitespace-nowrap hover:bg-slate-50">Needs Human</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingLeads ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">Loading contacts...</div>
          ) : leadsError ? (
            <div className="p-8 text-center text-red-500 text-sm font-medium">{leadsError}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(filteredLeads || []).map(lead => {
                const isActive = activeLead?.id === lead.id;
                return (
                  <div 
                    key={lead.id} 
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isActive 
                        ? 'bg-blue-50 border-blue-600' 
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveLead(lead)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 border border-slate-300">
                          {lead.metadata?.name ? lead.metadata.name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {lead.metadata?.name || lead.phone_number}
                          </h4>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
                            {lead.updated_at ? new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mb-1.5">
                          {lead.is_ai_enabled ? 'Bot is handling...' : 'Needs your reply...'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.status === 'NEEDS_HUMAN' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase border border-red-200">Needs Human</span>
                          )}
                          {lead.is_ai_enabled && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase border border-blue-200 flex items-center">
                              <Bot className="w-2.5 h-2.5 mr-0.5" /> AI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredLeads.length === 0 && <div className="p-8 text-slate-500 text-center text-sm font-medium">No contacts found.</div>}
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE PANEL: Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50 min-w-0 relative">
        {activeLead ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-6 shrink-0 z-20 shadow-sm relative">
              <div className="flex items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center">
                    {activeLead.metadata?.name || activeLead.phone_number}
                    {activeLead.is_ai_enabled && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Bot Assigned</span>}
                  </h3>
                  <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center">
                    <Phone className="w-3 h-3 mr-1" /> {activeLead.phone_number}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleAiPilot}
                  className="flex items-center text-sm font-semibold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 shadow-sm transition-colors"
                >
                  <UserCog className="w-4 h-4 mr-2 text-slate-500" />
                  Assign Conversation
                  <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Active Status Banner */}
            <div className={`py-1.5 px-6 text-center text-xs font-bold text-white shadow-sm z-10 flex items-center justify-center gap-2
              ${activeLead.is_ai_enabled ? 'bg-orange-500' : 'bg-slate-800'}`}
            >
              {activeLead.is_ai_enabled ? (
                <><Bot className="w-4 h-4" /> 🤖 The bot is active</>
              ) : (
                <><UserCog className="w-4 h-4" /> 👤 Human takeover active</>
              )}
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#e5ddd5] bg-opacity-30 relative z-0">
              {/* WhatsApp background pattern simulation */}
              <div className="absolute inset-0 z-[-1] opacity-5 pointer-events-none" style={{backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')"}}></div>

              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin mb-3"></div>
                    <div className="text-slate-500 text-sm font-medium">Loading messages...</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center my-4">
                    <span className="bg-white/80 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-lg shadow-sm">
                      TODAY
                    </span>
                  </div>
                  
                  {(messages || []).map(msg => {
                    const isUser = msg.sender === 'USER';
                    const isAI = msg.sender === 'AI';
                    const isAgent = msg.sender === 'AGENT';
                    const isOutgoing = isAI || isAgent;
                    
                    return (
                      <div key={msg.id} className={`flex ${!isOutgoing ? 'justify-start' : 'justify-end'} mb-4`}>
                        <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm relative group
                          ${!isOutgoing ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' : 'bg-blue-600 text-white rounded-tr-none'}
                        `}>
                          
                          {/* Media Handling */}
                          {msg.type === 'image' && msg.mediaUrl && (
                            <div className="mb-2 -mx-1 -mt-1 rounded-xl overflow-hidden cursor-pointer hover:opacity-95">
                              <img src={msg.mediaUrl} alt="Attachment" className="w-full h-auto max-h-64 object-cover" />
                            </div>
                          )}
                          
                          {msg.type === 'video' && msg.mediaUrl && (
                            <div className="mb-2 -mx-1 -mt-1 rounded-xl overflow-hidden bg-black relative">
                              <video controls className="w-full max-h-64 outline-none">
                                <source src={msg.mediaUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                          
                          {/* Message Content */}
                          {msg.content && (
                            <p className="text-[15px] leading-snug whitespace-pre-wrap">{msg.content}</p>
                          )}
                          
                          <div className={`text-right text-[10px] mt-1 font-medium flex items-center justify-end gap-1 opacity-80 ${!isOutgoing ? 'text-slate-400' : 'text-blue-100'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            {isOutgoing && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-2" />
                </>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0 shadow-inner z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <div className="flex gap-1 mb-1">
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                    <Smile className="w-6 h-6" />
                  </button>
                  <button type="button" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                    <Paperclip className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full py-3 px-4 focus:outline-none resize-none h-[48px] max-h-[120px] text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                  <div className="flex items-center pr-2 bg-white">
                     <div className="p-1.5 bg-green-50 rounded text-green-600 border border-green-100 mx-1 tooltip" title="Sending via WhatsApp">
                       <MessageCircle className="w-4 h-4" />
                     </div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="p-3.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all shadow-sm flex items-center justify-center mb-0.5 hover:shadow-md"
                  disabled={isSending || !newMessage.trim()}
                >
                  <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : 'ml-0.5'}`} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">WhatsApp Web CRM</h3>
            <p className="text-sm font-medium text-slate-500">Select a contact to view their pipeline and chat history.</p>
          </div>
        )}
      </div>

      {/* 3. RIGHT PANEL: Contact Metadata Sidebar */}
      {activeLead && (
        <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto shadow-[-2px_0_10px_-3px_rgba(0,0,0,0.05)] z-20">
          
          {/* Profile Header */}
          <div className="p-6 flex flex-col items-center border-b border-slate-100">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center shadow-inner border border-slate-200 overflow-hidden">
                <User className="w-12 h-12 text-slate-400" />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 text-center">{activeLead.metadata?.name || 'Unknown Contact'}</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">{activeLead.phone_number}</p>
          </div>

          {/* Profile Details */}
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">About</h4>
            <div className="space-y-4 text-sm font-medium text-slate-700">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Email</div>
                  <div>{activeLead.metadata?.email || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Phone</div>
                  <div>{activeLead.phone_number}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Local Time</div>
                  <div>12:45 PM (PKT)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Created Date</div>
                  <div>{activeLead.created_at ? new Date(activeLead.created_at).toLocaleDateString() : 'Today'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Flag className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Source</div>
                  <div className="bg-slate-100 px-2 py-0.5 rounded text-xs inline-block mt-1">Facebook Ads</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-slate-500 text-xs">Country</div>
                  <div>Pakistan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Accordions */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                📌 Pipelines
              </h4>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none outline-none"
                value={activeLead.status || 'NEW'}
                onChange={(e) => updateStatus(e.target.value)}
              >
                <option value="NEW">Lead (New)</option>
                <option value="NEEDS_HUMAN">Busy</option>
                <option value="CALL_BACK">Call Back Request</option>
                <option value="QUALIFIED">Interested</option>
                <option value="CLOSED">Won</option>
              </select>
            </div>
          </div>

          <div className="p-5 border-b border-slate-100 bg-yellow-50/30">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                📝 Notes
              </h4>
              <Plus className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600" />
            </div>
            <div className="mt-2">
              <textarea 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white shadow-sm resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 placeholder:text-slate-400"
                placeholder="Add internal CRM notes..."
                rows={3}
              ></textarea>
              <button className="w-full mt-2 py-2 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-200">
                Add Note
              </button>
            </div>
          </div>

          <div className="p-5 pb-8">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                🏷️ Tags & Drip Campaigns
              </h4>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold flex items-center border border-slate-200">
                <Tag className="w-3 h-3 mr-1 text-slate-400" /> High Priority
              </span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold flex items-center border border-blue-200">
                <Tag className="w-3 h-3 mr-1 text-blue-400" /> Summer Promo
              </span>
              <button className="px-2.5 py-1 bg-white border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 rounded-md text-xs font-bold flex items-center hover:bg-slate-50 transition-colors">
                <Plus className="w-3 h-3 mr-1" /> Add Tag
              </button>
            </div>
            
            <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-600 mb-1">Active Drip: "Follow-up Day 3"</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 mt-2">
                <div className="bg-green-500 h-1.5 rounded-full w-1/3"></div>
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-1 font-semibold">1 of 3 messages sent</div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
