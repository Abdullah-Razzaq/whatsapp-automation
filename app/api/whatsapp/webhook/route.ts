import { supabase } from '../../../../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function sendWhatsAppMessage(to: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v20.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  return response.json();
}

async function sendWhatsAppInteractiveButtons(to: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v20.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_buyer', title: 'Talk to Sales' } },
            { type: 'reply', reply: { id: 'btn_supplier', title: 'Supplier/Info' } },
            { type: 'reply', reply: { id: 'btn_meeting', title: 'Book Meeting' } },
          ],
        },
      },
    }),
  });
  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return new Response('Not found', { status: 404 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return new Response('OK', { status: 200 });
    }

    const from = message.from;
    const messageId = message.id;

    if (message.type === 'interactive') {
      const buttonId = message.interactive?.button_reply?.id;

      const categoryMap: Record<string, string> = {
        'btn_buyer': 'Buyer',
        'btn_supplier': 'Supplier',
        'btn_meeting': 'Meeting',
        'btn_mentorship': 'Mentorship',
      };

      const category = categoryMap[buttonId] || 'General';

      await supabase
        .from('leads')
        .upsert({ phone: from, category, status: 'NEEDS_HUMAN' }, { onConflict: 'phone' });

      await sendWhatsAppMessage(from, 'Thank you! A representative will reach out to you shortly.');

      return new Response('OK', { status: 200 });
    }

    if (message.type === 'text') {
      const text = message.text.body;

      const { data: lead } = await supabase
        .from('leads')
        .select('status')
        .eq('phone', from)
        .maybeSingle();

      if (lead?.status === 'NEEDS_HUMAN') {
        return new Response('OK', { status: 200 });
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const prompt = `You are a helpful assistant for our software/services. Answer the following query in exactly 2 concise sentences: "${text}"`;
      
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      await supabase.from('messages').insert([
        { phone: from, role: 'user', content: text, message_id: messageId },
        { phone: from, role: 'assistant', content: aiResponse },
      ]);

      await sendWhatsAppInteractiveButtons(from, aiResponse);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook POST:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
