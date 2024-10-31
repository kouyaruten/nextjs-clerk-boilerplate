import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs';
import { NextRequest } from 'next/server';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  // Deduct credits
  const { userId } = auth();
  const currentCredits = user?.publicMetadata?.credits || 0;
  if (currentCredits <= 0) {
    return new Response('No credits left', { status: 400 });
  }
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      credits: currentCredits - 1,
    },
  });

  // Get message
  const body = await req.json();
  const message = body.message;
  const data = {
    messages: [
      {
        content: `You are a helpful AI assistant.`,
        role: 'system',
      },
      {
        content: message,
        role: 'user',
      },
    ],
    model: 'deepseek-chat',
    stream: true,
  };

  const config = {
    method: 'post',
    url: DEEPSEEK_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    data: data,
  };
  try {
    const response = await axios({
      ...config,
      responseType: 'stream',
    });

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        for await (const chunk of response.data) {
          const text = decoder.decode(chunk);
          const lines = text.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw new Error('Failed to get response from DeepSeek API');
  }
}
