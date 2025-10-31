import { memo } from 'react';
import { Bot, User, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isNew?: boolean;
}

function formatMessage(text: string): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const lines = text.split('\n');
  let keyCounter = 0;

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) {
      elements.push(<br key={`br-${keyCounter++}`} />);
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="text-lg font-bold mt-3 mb-2">
          {formatInlineText(line.substring(2))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h4 key={`h4-${keyCounter++}`} className="text-base font-bold mt-2 mb-1">
          {formatInlineText(line.substring(3))}
        </h4>
      );
    } else if (line.match(/^[\d]+\.\s/)) {
      const match = line.match(/^([\d]+)\.\s(.+)$/);
      if (match) {
        elements.push(
          <div key={`ol-${keyCounter++}`} className="flex gap-2 my-1">
            <span className="font-semibold text-terracotta-600">{match[1]}.</span>
            <span>{formatInlineText(match[2])}</span>
          </div>
        );
      }
    } else if (line.match(/^[•●▪︎◦∙]\s/) || line.match(/^[-*]\s/)) {
      const match = line.match(/^[•●▪︎◦∙\-*]\s(.+)$/);
      if (match) {
        elements.push(
          <div key={`ul-${keyCounter++}`} className="flex gap-2 my-1">
            <span className="text-terracotta-600">•</span>
            <span>{formatInlineText(match[1])}</span>
          </div>
        );
      }
    } else if (line.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${keyCounter++}`}
          className="border-l-4 border-terracotta-400 pl-3 py-1 my-2 italic text-gray-700"
        >
          {formatInlineText(line.substring(2))}
        </div>
      );
    } else if (line.startsWith('```')) {
      elements.push(<br key={`code-br-${keyCounter++}`} />);
    } else {
      elements.push(
        <p key={`p-${keyCounter++}`} className="my-1">
          {formatInlineText(line)}
        </p>
      );
    }
  });

  return elements;
}

function formatInlineText(text: string): (string | JSX.Element)[] {
  const elements: (string | JSX.Element)[] = [];
  let current = text;
  let keyCounter = 0;

  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, render: (match: string) => <strong key={`b-${keyCounter++}`}>{match}</strong> },
    { regex: /\*(.+?)\*/g, render: (match: string) => <em key={`i-${keyCounter++}`}>{match}</em> },
    { regex: /`(.+?)`/g, render: (match: string) => <code key={`c-${keyCounter++}`} className="bg-gray-100 px-1 rounded text-sm">{match}</code> },
    { regex: /\[(.+?)\]\((.+?)\)/g, render: (text: string, url: string) => (
      <a key={`a-${keyCounter++}`} href={url} target="_blank" rel="noopener noreferrer" className="text-terracotta-600 hover:underline inline-flex items-center gap-1">
        {text}
        <ExternalLink className="h-3 w-3" />
      </a>
    )},
  ];

  const parts: Array<{ text: string; type: 'text' | 'bold' | 'italic' | 'code' | 'link'; data?: any }> = [];
  let lastIndex = 0;

  const allMatches: Array<{ index: number; length: number; type: string; data: any }> = [];

  patterns.forEach((pattern, patternIndex) => {
    const regex = new RegExp(pattern.regex);
    let match;
    const testText = text;
    const globalRegex = new RegExp(pattern.regex.source, 'g');

    while ((match = globalRegex.exec(testText)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: ['bold', 'italic', 'code', 'link'][patternIndex],
        data: match,
      });
    }
  });

  allMatches.sort((a, b) => a.index - b.index);

  allMatches.forEach((match) => {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    if (match.type === 'bold') {
      elements.push(<strong key={`b-${keyCounter++}`}>{match.data[1]}</strong>);
    } else if (match.type === 'italic') {
      elements.push(<em key={`i-${keyCounter++}`}>{match.data[1]}</em>);
    } else if (match.type === 'code') {
      elements.push(<code key={`c-${keyCounter++}`} className="bg-gray-100 px-1 rounded text-sm">{match.data[1]}</code>);
    } else if (match.type === 'link') {
      elements.push(
        <a key={`a-${keyCounter++}`} href={match.data[2]} target="_blank" rel="noopener noreferrer" className="text-terracotta-600 hover:underline inline-flex items-center gap-1">
          {match.data[1]}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    lastIndex = match.index + match.length;
  });

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

function ChatMessage({ role, content, timestamp, isNew = false }: ChatMessageProps) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  const hasAlert = content.includes('🚨') || content.includes('ALERTE') || content.includes('ARNAQUE');
  const hasSuccess = content.includes('✅') || content.includes('PROTÉGÉ');

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isNew ? 'animate-slide-in' : ''}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-terracotta-500 to-coral-500'
            : 'bg-gradient-to-br from-green-500 to-emerald-600'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 max-w-[85%]`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white rounded-tr-none shadow-lg'
              : hasAlert
              ? 'bg-red-50 border-2 border-red-300 text-gray-900 rounded-tl-none shadow-md'
              : hasSuccess
              ? 'bg-green-50 border-2 border-green-300 text-gray-900 rounded-tl-none shadow-md'
              : 'bg-white border-2 border-gray-200 text-gray-900 rounded-tl-none shadow-sm'
          }`}
        >
          {hasAlert && isAssistant && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-300">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="font-bold text-red-600 text-sm">Alerte Sécurité</span>
            </div>
          )}

          {hasSuccess && isAssistant && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-300">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="font-bold text-green-600 text-sm">Information Sécurisée</span>
            </div>
          )}

          <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
            {formatMessage(content)}
          </div>
        </div>

        <span className={`text-xs mt-1 px-2 ${isUser ? 'text-gray-500' : 'text-gray-400'}`}>
          {new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

export default memo(ChatMessage);
