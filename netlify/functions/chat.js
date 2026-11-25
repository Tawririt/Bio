
export default async (req) => {
  // السماح بطلبات POST فقط
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "طريقة الطلب غير مسموحة" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "الرسالة فارغة" }),
        { status: 400 }
      );
    }

    const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      throw new Error("مفتاح API غير مضبوط في Netlify");
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: "أنت مساعد ذكي وودود داخل موقع Taourirt Bio. أجب باللغة العربية بوضوح، وساعد زوار الموقع في أسئلتهم.",
          messages: [
            ...history,
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data.error?.message || "حدث خطأ في خدمة الذكاء الاصطناعي"
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const answer = data.content
      ?.filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n") || "لم أتمكن من إنشاء إجابة.";

    return new Response(
      JSON.stringify({ reply: answer }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "حدث خطأ داخلي" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
