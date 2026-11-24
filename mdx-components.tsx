import type { MDXComponents } from "mdx/types";

// Body styles for build-log posts (/log/[slug], a design gap): the build log's serif type.
const components: MDXComponents = {
  p: (props) => <p className="m-0 font-serif text-[21px] leading-[1.55]" {...props} />,
  h2: (props) => <h2 className="m-0 font-serif text-[34px] font-normal" {...props} />,
  a: (props) => <a className="text-accent" {...props} />,
  // Lists in the same serif body type (Tailwind's preflight strips list markers).
  ul: (props) => <ul className="m-0 flex list-disc flex-col gap-2 pl-[1.2em] font-serif text-[21px] leading-[1.55]" {...props} />,
  ol: (props) => <ol className="m-0 flex list-decimal flex-col gap-2 pl-[1.2em] font-serif text-[21px] leading-[1.55]" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
