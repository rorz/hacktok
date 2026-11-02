import { type ReactNode, useMemo } from "react";

function renderNode(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;
  const children = Array.from(node.childNodes, (child, index) =>
    renderNode(child, `${key}.${index}`),
  );
  switch (node.tagName.toLowerCase()) {
    case "p":
      return <p key={key}>{children}</p>;
    case "br":
      return <br key={key} />;
    case "i":
    case "em":
      return <em key={key}>{children}</em>;
    case "b":
    case "strong":
      return <strong key={key}>{children}</strong>;
    case "pre":
      return <pre key={key}>{children}</pre>;
    case "code":
      return <code key={key}>{children}</code>;
    case "a": {
      const href = node.getAttribute("href") ?? "";
      // Only reconstruct explicit web links. No upstream HTML, event handlers, or attributes are mounted.
      if (!/^https?:\/\//i.test(href)) return children;
      return (
        <a key={key} href={href} target="_blank" rel="noreferrer nofollow">
          {children}
        </a>
      );
    }
    default:
      return null;
  }
}

export function CommentText({ html }: { html: string }) {
  const content = useMemo(() => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return Array.from(document.body.childNodes, (node, index) =>
      renderNode(node, String(index)),
    );
  }, [html]);
  return <div className="comment-text">{content}</div>;
}
