"use server"

export async function sendToCliq(text: string) {
  const response = await fetch(
    `https://cliq.zoho.com/api/v2/bots/sans/incoming?zapikey=${process.env.ZOHO_CLIQ_WEBHOOK_TOKEN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
