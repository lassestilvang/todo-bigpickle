import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  content: string
  className?: string
}

export const Markdown = memo(function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {children}
            </a>
          ),
          code: ({ className: cn, children, ...props }) => {
            const isInline = !cn
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <pre className="p-3 rounded-lg bg-muted overflow-x-auto text-xs">
                <code className={cn} {...props}>{children}</code>
              </pre>
            )
          },
          ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          p: ({ children }) => <p className="text-sm leading-relaxed my-1.5">{children}</p>,
          h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mt-2 mb-0.5">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/20 pl-3 my-1.5 text-muted-foreground text-sm italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border/50" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/50 px-2 py-1 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border border-border/50 px-2 py-1">{children}</td>,
          input: ({ checked, ...props }) => (
            <input type="checkbox" checked={checked} readOnly className="mr-1.5" {...props} />
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through text-muted-foreground/70">{children}</del>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
