export default async function enviarMensagem(mensagem: any) {
  const meta_phone_id = process.env.META_PHONE_ID;
  const response = await fetch(`https://graph.facebook.com/v25.0/${meta_phone_id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.META_TOKEN}`
    },
    body: JSON.stringify(mensagem)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Erro ao comunicar com a Meta API");
  }
  return data;
}