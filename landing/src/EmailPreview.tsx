import { Fragment } from "react";
import { parseEmailBody } from "./email-preview";

type EmailPreviewProps = {
  subject: string | null;
  body: string;
};

/** The recipient-facing email, rendered from the same narrow contract sent. */
export function EmailPreview({ subject, body }: EmailPreviewProps) {
  const paragraphs = parseEmailBody(body);

  return (
    <section className="email-preview" aria-label="Email as the recipient will see it">
      {subject && (
        <div className="email-preview-subject">
          <span>Subject</span>
          <strong>{subject}</strong>
        </div>
      )}
      <div className="email-preview-body">
        {paragraphs.map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>
            {paragraph.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line.kind === "text" ? (
                  line.text
                ) : (
                  <a href={line.linkUrl} target="_blank" rel="noopener noreferrer">
                    <img src={line.imageUrl} alt={line.alt} />
                  </a>
                )}
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
