import { Typography } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders user-provided Markdown with Mantine typography. Raw HTML is not rendered. */
export function Markdown({ children, size }: { children: string; size?: 'sm' | 'xs' }) {
  return (
    <Typography fz={size}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `node` must not reach the DOM
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </Typography>
  );
}
