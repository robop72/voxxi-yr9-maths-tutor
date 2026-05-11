"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ExpertMessageProps {
  text: string;
}

const ExpertMessage: React.FC<ExpertMessageProps> = ({ text }) => {
  const imageRegex = /<image>(.*?)<\/image>/g;
  const parts = text.split(imageRegex);

  return (
    <div className="tutor-message-content whitespace-pre-wrap">
      {parts.map((part, index) => {
        // If it's a captured group from the regex (the image description)
        if (index % 2 === 1) {
          const query = encodeURIComponent(part);
          // Using Unsplash as the image source
          const imageUrl = `https://source.unsplash.com/featured/?${query},diagram,science`;
          
          return (
            <div key={index} className="my-6 text-center">
              <img 
                src={imageUrl} 
                alt={part} 
                className="max-w-full h-auto rounded-xl shadow-lg border border-gray-100 mx-auto"
              />
              <p className="text-sm text-gray-500 mt-3 italic">
                {part}
              </p>
            </div>
          );
        }

        // Otherwise, render as Markdown with Math support
        return (
          <div key={index} className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {part}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
};

export default ExpertMessage;