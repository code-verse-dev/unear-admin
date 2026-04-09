import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "blockquote", "code-block"],
    ["clean"],
  ],
};

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * WYSIWYG HTML editor (Quill). Store output in API `content` fields as HTML.
 */
export function RichTextEditor({ value, onChange, placeholder, className, disabled }: RichTextEditorProps) {
  const m = useMemo(() => modules, []);

  return (
    <div
      className={cn(
        "rich-text-editor overflow-hidden rounded-md border border-input bg-background",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={m}
        readOnly={disabled}
        placeholder={placeholder}
        className="[&_.ql-toolbar]:border-border [&_.ql-toolbar]:border-b [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-foreground"
      />
    </div>
  );
}
