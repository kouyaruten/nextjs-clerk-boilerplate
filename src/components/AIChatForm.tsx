'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

const AIChatForm = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (message: string) => {
    try {
      setIsLoading(true);
      setResponse(''); // 清空之前的响应

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let streamedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        streamedResponse += text;
        setResponse(streamedResponse);
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);
      setResponse('Error: Failed to get response from AI');
    } finally {
      setIsLoading(true);
    }
  };

  return (
    <>
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          className="w-full"
          type="text"
          placeholder="Prompting with AI…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
        />
        <Button type="submit" onClick={() => handleSubmit(message)} disabled={!message || isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <p className="font-mono text-sm text-gray-700">
        {response ? response : 'Try sending a message to see the AI response.'}
      </p>
    </>
  );
};

export default AIChatForm;
