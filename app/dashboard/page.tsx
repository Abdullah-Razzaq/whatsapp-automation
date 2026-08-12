'use client';

import React from 'react';
import { MessageCircle, Users, Clock, Zap, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', contacts: 120, responses: 80 },
  { name: 'Tue', contacts: 150, responses: 110 },
  { name: 'Wed', contacts: 180, responses: 140 },
  { name: 'Thu', contacts: 190, responses: 160 },
  { name: 'Fri', contacts: 250, responses: 200 },
  { name: 'Sat', contacts: 210, responses: 180 },
  { name: 'Sun', contacts: 160, responses: 130 },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome back! Here's what's happening with your bot today.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Contacts', value: '4,521', icon: Users, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'New Contacts', value: '342', icon: Activity, trend: '+5%', color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Active Chats', value: '28', icon: MessageCircle, trend: '-2%', color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Avg Response', value: '1.2s', icon: Zap, trend: '-10%', color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'First Response', value: '2.5s', icon: Clock, trend: '0%', color: 'text-indigo-600', bg: 'bg-indigo-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-50 border border-slate-100 ${stat.trend.startsWith('+') ? 'text-emerald-600' : stat.trend.startsWith('-') ? 'text-amber-600' : 'text-slate-400'}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              <p className="text-sm text-slate-500 font-semibold mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart and Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-slate-400" />
            Engagement Activity
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600 }} 
                />
                <Area type="monotone" dataKey="contacts" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorContacts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Connected Channels</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage active integrations</p>
          </div>
          <div className="flex-1 p-3 space-y-2 bg-slate-50/50">
            {[
              { name: 'WhatsApp', desc: 'Primary B2B channel', active: true },
              { name: 'Messenger', desc: 'Facebook page', active: false },
              { name: 'Instagram', desc: 'IG Direct Messages', active: false },
              { name: 'Webchat', desc: 'Website widget', active: false },
            ].map(channel => (
              <div key={channel.name} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-yellow-200 hover:shadow-md transition-all group">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${channel.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{channel.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{channel.desc}</p>
                  </div>
                </div>
                {channel.active ? (
                  <button className="px-3 py-1.5 bg-yellow-400 text-yellow-950 text-xs font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-sm">
                    Test Now
                  </button>
                ) : (
                  <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
