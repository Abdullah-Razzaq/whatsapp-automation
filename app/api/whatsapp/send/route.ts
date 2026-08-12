import { supabase } from '../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { recipientPhone, messageText } = await request.json();

    if (!recipientPhone || !messageText) {
      return new Response(JSON.stringify({ error: 'recipientPhone and messageText are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Call Meta's WhatsApp Cloud API
    // Using v20.0 or the version specified in your env file (meta api URL). Let's use v20.0 as in the webhook. 
    // The prompt says v22.0, I will use v22.0.
    const metaResponse = await fetch(`https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { body: messageText },
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta API Error:', metaData);
      return new Response(JSON.stringify({ error: 'Failed to send message via Meta API', details: metaData }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Save to messages table
    // First, find the lead ID
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone_number', recipientPhone)
      .maybeSingle();

    if (lead) {
      await supabase.from('messages').insert([{
        lead_id: lead.id,
        sender: 'AGENT',
        content: messageText,
        raw_payload: metaData
      }]);
    }

    return new Response(JSON.stringify({ success: true, metaData }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error sending outbound message:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
